import { S3Client, PutObjectCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Helper to sanitize env values
function cleanEnv(val?: string | null): string {
  if (!val) return '';
  return val.replace(/["';,\r\n\t]/g, '').trim();
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
  isConfigured: boolean;
}

/**
 * Dynamically resolves Cloudflare R2 credentials from process.env, supporting multiple naming conventions.
 */
export function getR2Credentials(): R2Config {
  let accountId = '';
  let accessKeyId = '';
  let secretAccessKey = '';
  let bucketName = '';
  let publicDomain = '';

  if (typeof process !== 'undefined' && process.env) {
    // 1. Account ID
    accountId =
      cleanEnv(process.env.R2_ACCOUNT_ID) ||
      cleanEnv(process.env.CLOUDFLARE_ACCOUNT_ID) ||
      cleanEnv(process.env.CF_ACCOUNT_ID) ||
      cleanEnv(process.env.CLOUDFLARE_R2_ACCOUNT_ID) ||
      cleanEnv(process.env.NEXT_PUBLIC_R2_ACCOUNT_ID);

    // 2. Access Key ID
    accessKeyId =
      cleanEnv(process.env.R2_ACCESS_KEY_ID) ||
      cleanEnv(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) ||
      cleanEnv(process.env.CF_R2_ACCESS_KEY_ID) ||
      cleanEnv(process.env.CF_ACCESS_KEY_ID) ||
      cleanEnv(process.env.R2_ACCESS_KEY) ||
      cleanEnv(process.env.R2_KEY_ID) ||
      cleanEnv(process.env.ACCESS_KEY_ID);

    // 3. Secret Access Key
    secretAccessKey =
      cleanEnv(process.env.R2_SECRET_ACCESS_KEY) ||
      cleanEnv(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) ||
      cleanEnv(process.env.CF_R2_SECRET_ACCESS_KEY) ||
      cleanEnv(process.env.CF_SECRET_ACCESS_KEY) ||
      cleanEnv(process.env.R2_SECRET_KEY) ||
      cleanEnv(process.env.R2_SECRET) ||
      cleanEnv(process.env.SECRET_ACCESS_KEY);

    // 4. Bucket Name
    bucketName =
      cleanEnv(process.env.R2_BUCKET_NAME) ||
      cleanEnv(process.env.CLOUDFLARE_R2_BUCKET_NAME) ||
      cleanEnv(process.env.CF_R2_BUCKET_NAME) ||
      cleanEnv(process.env.R2_BUCKET) ||
      cleanEnv(process.env.BUCKET_NAME) ||
      'musclecraft-videos';

    // 5. Public Domain
    publicDomain =
      cleanEnv(process.env.R2_PUBLIC_DOMAIN) ||
      cleanEnv(process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN) ||
      cleanEnv(process.env.R2_PUBLIC_URL) ||
      cleanEnv(process.env.R2_DOMAIN) ||
      cleanEnv(process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN) ||
      cleanEnv(process.env.NEXT_PUBLIC_R2_DOMAIN) ||
      '';

    // Fallback: Case-insensitive scan across all process.env keys
    if (!accountId || !accessKeyId || !secretAccessKey) {
      for (const [key, val] of Object.entries(process.env)) {
        if (!val) continue;
        const clean = cleanEnv(val);
        const lowerKey = key.toLowerCase();

        if (!accountId && (lowerKey === 'r2_account_id' || lowerKey.includes('cloudflare_account') || (lowerKey.includes('r2') && lowerKey.includes('account')))) {
          accountId = clean;
        }
        if (!accessKeyId && (lowerKey === 'r2_access_key_id' || (lowerKey.includes('r2') && lowerKey.includes('access')) || (lowerKey.includes('r2') && lowerKey.includes('key_id')))) {
          accessKeyId = clean;
        }
        if (!secretAccessKey && (lowerKey === 'r2_secret_access_key' || (lowerKey.includes('r2') && lowerKey.includes('secret')))) {
          secretAccessKey = clean;
        }
        if (!publicDomain && (lowerKey.includes('r2') && (lowerKey.includes('domain') || lowerKey.includes('url')))) {
          publicDomain = clean;
        }
      }
    }
  }

  // Ensure publicDomain starts with https:// if provided
  if (publicDomain && !publicDomain.startsWith('http://') && !publicDomain.startsWith('https://')) {
    publicDomain = `https://${publicDomain}`;
  }

  const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain,
    isConfigured,
  };
}

/**
 * Creates or returns an authenticated S3Client for Cloudflare R2
 */
export function getR2Client(): S3Client | null {
  const config = getR2Credentials();
  if (!config.isConfigured) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// Backward-compatible export
export const isR2Configured = Boolean(
  cleanEnv(process.env.R2_ACCOUNT_ID) &&
  cleanEnv(process.env.R2_ACCESS_KEY_ID) &&
  cleanEnv(process.env.R2_SECRET_ACCESS_KEY)
);

export const R2_BUCKET_NAME = cleanEnv(process.env.R2_BUCKET_NAME) || 'musclecraft-videos';
export const R2_PUBLIC_DOMAIN = cleanEnv(process.env.R2_PUBLIC_DOMAIN) || '';

/**
 * Ping Cloudflare R2 bucket to verify authentication and access permissions
 */
export async function pingR2(): Promise<{
  ok: boolean;
  latencyMs: number;
  bucket: string;
  publicDomain: string;
  error?: string;
  accountMasked?: string;
  accessKeyMasked?: string;
}> {
  const config = getR2Credentials();
  if (!config.isConfigured) {
    return {
      ok: false,
      latencyMs: 0,
      bucket: config.bucketName,
      publicDomain: config.publicDomain,
      error: 'Cloudflare R2 credentials (Account ID, Access Key ID, Secret Access Key) are not configured in environment variables.',
    };
  }

  const client = getR2Client();
  if (!client) {
    return {
      ok: false,
      latencyMs: 0,
      bucket: config.bucketName,
      publicDomain: config.publicDomain,
      error: 'Failed to initialize S3 client for Cloudflare R2.',
    };
  }

  const start = Date.now();
  try {
    // Check bucket existence/access via HeadBucket
    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    const latency = Date.now() - start;

    return {
      ok: true,
      latencyMs: latency,
      bucket: config.bucketName,
      publicDomain: config.publicDomain,
      accountMasked: `${config.accountId.substring(0, 6)}****${config.accountId.substring(config.accountId.length - 4)}`,
      accessKeyMasked: `${config.accessKeyId.substring(0, 6)}****${config.accessKeyId.substring(config.accessKeyId.length - 4)}`,
    };
  } catch (err: any) {
    // If HeadBucket fails, try ListObjectsV2 with max 1 object
    try {
      await client.send(new ListObjectsV2Command({ Bucket: config.bucketName, MaxKeys: 1 }));
      const latency = Date.now() - start;
      return {
        ok: true,
        latencyMs: latency,
        bucket: config.bucketName,
        publicDomain: config.publicDomain,
        accountMasked: `${config.accountId.substring(0, 6)}****${config.accountId.substring(config.accountId.length - 4)}`,
        accessKeyMasked: `${config.accessKeyId.substring(0, 6)}****${config.accessKeyId.substring(config.accessKeyId.length - 4)}`,
      };
    } catch (listErr: any) {
      const latency = Date.now() - start;
      return {
        ok: false,
        latencyMs: latency,
        bucket: config.bucketName,
        publicDomain: config.publicDomain,
        error: listErr.message || err.message || 'Could not connect to Cloudflare R2 bucket.',
        accountMasked: `${config.accountId.substring(0, 6)}****${config.accountId.substring(config.accountId.length - 4)}`,
        accessKeyMasked: `${config.accessKeyId.substring(0, 6)}****${config.accessKeyId.substring(config.accessKeyId.length - 4)}`,
      };
    }
  }
}

/**
 * Upload a video buffer or file stream to Cloudflare R2 bucket
 */
export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const config = getR2Credentials();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    throw new Error('Cloudflare R2 storage credentials are not configured in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  await client.send(command);

  // Construct public playback URL
  let publicUrl = '';
  if (config.publicDomain) {
    const domain = config.publicDomain.replace(/\/+$/, '');
    const cleanKey = params.key.replace(/^\/+/, '');
    publicUrl = `${domain}/${cleanKey}`;
  } else {
    // Standard R2 public bucket path format
    publicUrl = `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${params.key}`;
  }

  return { url: publicUrl, key: params.key };
}
