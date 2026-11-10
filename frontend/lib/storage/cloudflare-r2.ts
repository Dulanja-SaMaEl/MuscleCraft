import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

// Clean environment variable values
function cleanEnv(val?: string | null): string {
  if (!val) return '';
  return val.replace(/["';,\r\n\t]/g, '').trim();
}

const accountId =
  cleanEnv(process.env.R2_ACCOUNT_ID) ||
  cleanEnv(process.env.CLOUDFLARE_ACCOUNT_ID) ||
  cleanEnv(process.env.CF_ACCOUNT_ID);

const accessKeyId =
  cleanEnv(process.env.R2_ACCESS_KEY_ID) ||
  cleanEnv(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) ||
  cleanEnv(process.env.CF_R2_ACCESS_KEY_ID);

const secretAccessKey =
  cleanEnv(process.env.R2_SECRET_ACCESS_KEY) ||
  cleanEnv(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) ||
  cleanEnv(process.env.CF_R2_SECRET_ACCESS_KEY);

export const R2_BUCKET_NAME =
  cleanEnv(process.env.R2_BUCKET_NAME) ||
  cleanEnv(process.env.CLOUDFLARE_R2_BUCKET_NAME) ||
  'musclecraft-videos';

export const R2_PUBLIC_DOMAIN =
  cleanEnv(process.env.R2_PUBLIC_DOMAIN) ||
  cleanEnv(process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN) ||
  '';

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey);

export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

/**
 * Upload a video buffer or file stream to Cloudflare R2 bucket
 */
export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  if (!r2Client) {
    throw new Error('Cloudflare R2 storage credentials are not configured in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  await r2Client.send(command);

  // Construct public playback URL
  let publicUrl = '';
  if (R2_PUBLIC_DOMAIN) {
    const domain = R2_PUBLIC_DOMAIN.replace(/\/+$/, '');
    const cleanKey = params.key.replace(/^\/+/, '');
    publicUrl = `${domain}/${cleanKey}`;
  } else {
    // Standard R2 public bucket path format
    publicUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${params.key}`;
  }

  return { url: publicUrl, key: params.key };
}
