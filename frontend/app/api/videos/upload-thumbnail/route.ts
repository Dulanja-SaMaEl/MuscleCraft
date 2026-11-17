import { NextRequest, NextResponse } from 'next/server';
import { getR2Credentials, uploadToR2 } from '@/lib/storage/cloudflare-r2';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { AuthService } from '@/lib/services/auth-service';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024; // 10 MB

async function isAuthorizedUploader(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const localUser = AuthService.getCurrentUser(userId);
  if (localUser) return localUser.role === 'admin' || localUser.role === 'instructor';

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      return data?.role === 'admin' || data?.role === 'instructor';
    } catch (_) {}
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!(await isAuthorizedUploader(userId))) {
      return NextResponse.json(
        { error: 'Forbidden: Only coaches and administrators can upload video thumbnails.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No thumbnail image provided.' }, { status: 400 });
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      return NextResponse.json({ error: 'Thumbnail image must be 10 MB or smaller.' }, { status: 400 });
    }

    const rawName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = (path.extname(rawName) || '.webp').toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Unsupported thumbnail format. Please upload JPG, PNG, WebP, or AVIF.' },
        { status: 400 }
      );
    }

    const safeExt = ALLOWED_IMAGE_EXTENSIONS.has(ext) ? ext : '.webp';
    const baseName = path.basename(rawName, ext).slice(0, 60) || 'cover';
    const uniqueKey = `thumb_${Date.now()}_${baseName}${safeExt}`;
    const contentType = file.type || (safeExt === '.png' ? 'image/png' : safeExt === '.webp' ? 'image/webp' : 'image/jpeg');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let uploadedUrl = '';
    let storageProvider = 'local_storage';

    // 1. Attempt Cloudflare R2
    const r2Config = getR2Credentials();
    if (r2Config.isConfigured) {
      try {
        const r2Result = await uploadToR2({
          key: uniqueKey,
          body: buffer,
          contentType,
        });
        uploadedUrl = r2Result.url;
        storageProvider = 'cloudflare_r2';
      } catch (r2Err: any) {
        console.warn('Cloudflare R2 thumbnail upload failed, trying fallback:', r2Err.message);
      }
    }

    // 2. Attempt Supabase Storage ('videos' bucket)
    if (!uploadedUrl && isServerSupabaseConfigured && supabaseServer) {
      try {
        const { data: sbData, error: sbErr } = await supabaseServer.storage
          .from('videos')
          .upload(uniqueKey, buffer, {
            contentType,
            upsert: true,
          });

        if (!sbErr && sbData) {
          const { data: pubData } = supabaseServer.storage.from('videos').getPublicUrl(uniqueKey);
          if (pubData?.publicUrl) {
            uploadedUrl = pubData.publicUrl;
            storageProvider = 'supabase_storage';
          }
        }
      } catch (sbErr) {
        console.warn('Supabase Storage thumbnail fallback failed, using local vault:', sbErr);
      }
    }

    // 3. Fallback: Save locally under public/uploads/thumbnails/
    if (!uploadedUrl) {
      try {
        const thumbDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
        if (!fs.existsSync(thumbDir)) {
          fs.mkdirSync(thumbDir, { recursive: true });
        }
        const filePath = path.join(thumbDir, uniqueKey);
        fs.writeFileSync(filePath, buffer);
        uploadedUrl = `/uploads/thumbnails/${uniqueKey}`;
        storageProvider = 'local_storage';
      } catch (diskErr: any) {
        return NextResponse.json(
          { error: 'Unable to save thumbnail image in this environment. Please paste an image URL or configure R2.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrl,
      key: uniqueKey,
      size: file.size,
      storageProvider,
    });
  } catch (err: any) {
    console.error('Thumbnail upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error while uploading thumbnail image.' },
      { status: 500 }
    );
  }
}
