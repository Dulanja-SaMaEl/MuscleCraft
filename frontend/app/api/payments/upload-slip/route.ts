import { NextRequest, NextResponse } from 'next/server';
import { getR2Credentials, uploadToR2 } from '@/lib/storage/cloudflare-r2';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { AuthService } from '@/lib/services/auth-service';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caller = (userId ? AuthService.getCurrentUser(userId) : null) || ({ id: 'usr_client_1', role: 'client' } as any);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No slip file provided for upload.' }, { status: 400 });
    }

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Receipt file size must be under 15 MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const rawName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(rawName) || '.jpg';
    const baseName = path.basename(rawName, ext);
    const uniqueKey = `slips/slip_${Date.now()}_${baseName}${ext}`;
    const contentType = file.type || 'image/jpeg';

    let uploadedUrl = '';
    let storageProvider = 'local_storage';

    // 1. Attempt Cloudflare R2 (Object Storage)
    const r2Config = getR2Credentials();
    if (r2Config.isConfigured) {
      try {
        const r2Result = await uploadToR2({
          key: uniqueKey,
          body: buffer,
          contentType: contentType,
        });
        uploadedUrl = r2Result.url;
        storageProvider = 'cloudflare_r2';
      } catch (r2Err: any) {
        console.warn('[Cloudflare R2] Slip upload fallback:', r2Err.message);
      }
    }

    // 2. Attempt Supabase Storage ('slips' or 'videos' bucket)
    if (!uploadedUrl && isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: sbData, error: sbErr } = await supabaseServer.storage
          .from('slips')
          .upload(uniqueKey, buffer, {
            contentType: contentType,
            upsert: true,
          });

        if (!sbErr && sbData) {
          const { data: pubData } = supabaseServer.storage.from('slips').getPublicUrl(uniqueKey);
          if (pubData?.publicUrl) {
            uploadedUrl = pubData.publicUrl;
            storageProvider = 'supabase_storage';
          }
        }
      } catch (sbErr) {
        console.warn('[Supabase Storage] Slip upload fallback:', sbErr);
      }
    }

    // 3. Fallback: Save to public/uploads/slips/ directory
    if (!uploadedUrl) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, path.basename(uniqueKey));
        fs.writeFileSync(filePath, buffer);
        uploadedUrl = `/uploads/slips/${path.basename(uniqueKey)}`;
        storageProvider = 'local_storage';
      } catch (diskErr: any) {
        // Fallback to inline data URI for preview resilience
        const base64Data = buffer.toString('base64');
        uploadedUrl = `data:${contentType};base64,${base64Data}`;
        storageProvider = 'inline_base64';
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrl,
      key: uniqueKey,
      filename: file.name,
      size: file.size,
      storageProvider,
      message: 'Bank transfer slip uploaded successfully.',
    });
  } catch (err: any) {
    console.error('Slip upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error occurred while uploading bank transfer slip.' },
      { status: 500 }
    );
  }
}
