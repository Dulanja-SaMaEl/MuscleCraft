import { NextRequest, NextResponse } from 'next/server';
import { getR2Credentials, getR2Client } from '@/lib/storage/cloudflare-r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing video key' }, { status: 400 });
    }

    const config = getR2Credentials();
    const client = getR2Client();

    // 1. If public domain is configured, redirect directly to CDN domain
    if (config.publicDomain) {
      const domain = config.publicDomain.replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      return NextResponse.redirect(`${domain}/${cleanKey}`, 307);
    }

    // 2. If R2 is configured with S3 credentials, generate presigned GET URL (24 hours) and redirect
    if (config.isConfigured && client) {
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      const signedPlayUrl = await getSignedUrl(client, command, {
        expiresIn: 86400, // 24 hours
      });

      return NextResponse.redirect(signedPlayUrl, 307);
    }

    // 3. Fallback: check local uploads
    return NextResponse.redirect(`/uploads/videos/${key}`, 307);
  } catch (err: any) {
    console.error('Video streaming proxy error:', err);
    return NextResponse.json({ error: err.message || 'Failed to stream video' }, { status: 500 });
  }
}
