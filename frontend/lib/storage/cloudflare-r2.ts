import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

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
    // Universal playback proxy via server-signed URL
    publicUrl = `/api/videos/stream?key=${encodeURIComponent(params.key)}`;
  }

  return { url: publicUrl, key: params.key };
}

/**
 * Generates a presigned direct PUT upload URL for Cloudflare R2.
 * Allows uploading files of any size (up to 5GB+) directly from browser to R2,
 * bypassing Vercel serverless request body limits (4.5MB).
 */
export async function getPresignedR2UploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const config = getR2Credentials();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    throw new Error('Cloudflare R2 storage credentials are not configured in environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 3600,
  });

  // Construct public playback URL
  let publicUrl = '';
  if (config.publicDomain) {
    const domain = config.publicDomain.replace(/\/+$/, '');
    const cleanKey = params.key.replace(/^\/+/, '');
    publicUrl = `${domain}/${cleanKey}`;
  } else {
    // Universal playback proxy via server-signed URL
    publicUrl = `/api/videos/stream?key=${encodeURIComponent(params.key)}`;
  }

  return { uploadUrl, publicUrl, key: params.key };
}

/**
 * Permanently deletes an object from Cloudflare R2 bucket
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; key: string; error?: string }> {
  const config = getR2Credentials();
  const client = getR2Client();

  if (!client || !config.isConfigured) {
    console.warn(`[Cloudflare R2] Deletion skipped for ${key}: R2 credentials are not configured.`);
    return { success: false, key, error: 'R2 storage credentials not configured.' };
  }

  try {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: cleanKey,
    });

    await client.send(command);
    console.log(`[Cloudflare R2] Successfully deleted object "${cleanKey}" from bucket "${config.bucketName}".`);
    return { success: true, key: cleanKey };
  } catch (err: any) {
    console.error(`[Cloudflare R2] Error deleting object "${key}" from bucket "${config.bucketName}":`, err);
    return { success: false, key, error: err.message || 'R2 DeleteObjectCommand failed.' };
  }
}

export interface R2StorageObjectSummary {
  key: string;
  sizeBytes: number;
  lastModified?: string;
}

export interface R2StorageStats {
  provider: 'cloudflare_r2' | 'local_storage';
  configured: boolean;
  connected: boolean;
  bucket: string;
  quotaGb: number;
  quotaBytes: number;
  usedBytes: number;
  remainingBytes: number;
  percentUsed: number;
  objectCount: number;
  quotaFormatted: string;
  usedFormatted: string;
  remainingFormatted: string;
  objects: R2StorageObjectSummary[];
  checkedAt: string;
  error?: string;
}

/**
 * Formats byte counts into readable B / KB / MB / GB strings.
 */
export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[idx]}`;
}

function getConfiguredQuotaGb(): number {
  const raw =
    cleanEnv(process.env.R2_STORAGE_QUOTA_GB) ||
    cleanEnv(process.env.CLOUDFLARE_R2_QUOTA_GB) ||
    cleanEnv(process.env.NEXT_PUBLIC_R2_QUOTA_GB);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10; // Cloudflare R2 Always Free 10 GB
}

/**
 * Computes real bucket utilization across all objects in Cloudflare R2 (via paginated ListObjectsV2),
 * or falls back to local public/uploads/videos usage when R2 is not configured.
 */
export async function getR2StorageStats(): Promise<R2StorageStats> {
  const config = getR2Credentials();
  const quotaGb = getConfiguredQuotaGb();
  const quotaBytes = Math.round(quotaGb * 1024 * 1024 * 1024);
  const checkedAt = new Date().toISOString();

  if (config.isConfigured) {
    const client = getR2Client();
    if (client) {
      try {
        let usedBytes = 0;
        let objectCount = 0;
        let continuationToken: string | undefined = undefined;
        const objects: R2StorageObjectSummary[] = [];

        do {
          const res: ListObjectsV2CommandOutput = await client.send(
            new ListObjectsV2Command({
              Bucket: config.bucketName,
              ContinuationToken: continuationToken,
              MaxKeys: 1000,
            })
          );

          for (const item of res.Contents || []) {
            const size = Number(item.Size || 0);
            usedBytes += size;
            objectCount += 1;
            if (item.Key && objects.length < 200) {
              objects.push({
                key: item.Key,
                sizeBytes: size,
                lastModified: item.LastModified ? item.LastModified.toISOString() : undefined,
              });
            }
          }

          continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
        } while (continuationToken);

        const remainingBytes = Math.max(0, quotaBytes - usedBytes);
        const percentUsed = quotaBytes > 0 ? Math.min(100, Number(((usedBytes / quotaBytes) * 100).toFixed(1))) : 0;

        return {
          provider: 'cloudflare_r2',
          configured: true,
          connected: true,
          bucket: config.bucketName,
          quotaGb,
          quotaBytes,
          usedBytes,
          remainingBytes,
          percentUsed,
          objectCount,
          quotaFormatted: formatStorageBytes(quotaBytes),
          usedFormatted: formatStorageBytes(usedBytes),
          remainingFormatted: formatStorageBytes(remainingBytes),
          objects: objects.sort((a, b) => b.sizeBytes - a.sizeBytes),
          checkedAt,
        };
      } catch (err: any) {
        return {
          provider: 'cloudflare_r2',
          configured: true,
          connected: false,
          bucket: config.bucketName,
          quotaGb,
          quotaBytes,
          usedBytes: 0,
          remainingBytes: quotaBytes,
          percentUsed: 0,
          objectCount: 0,
          quotaFormatted: formatStorageBytes(quotaBytes),
          usedFormatted: '0 B',
          remainingFormatted: formatStorageBytes(quotaBytes),
          objects: [],
          checkedAt,
          error: err.message || 'Unable to inspect Cloudflare R2 storage usage.',
        };
      }
    }
  }

  // Fallback: Measure local vault disk usage if running locally without R2
  let localUsedBytes = 0;
  let localCount = 0;
  const localObjects: R2StorageObjectSummary[] = [];

  try {
    for (const folder of ['videos', 'thumbnails']) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (fs.existsSync(uploadDir)) {
        const entries = fs.readdirSync(uploadDir);
        for (const name of entries) {
          if (name.startsWith('.')) continue;
          const fullPath = path.join(uploadDir, name);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            localUsedBytes += stat.size;
            localCount += 1;
            localObjects.push({
              key: name,
              sizeBytes: stat.size,
              lastModified: stat.mtime.toISOString(),
            });
          }
        }
      }
    }
  } catch (_) {}

  const remainingBytes = Math.max(0, quotaBytes - localUsedBytes);
  const percentUsed = quotaBytes > 0 ? Math.min(100, Number(((localUsedBytes / quotaBytes) * 100).toFixed(1))) : 0;

  return {
    provider: 'local_storage',
    configured: false,
    connected: false,
    bucket: config.bucketName,
    quotaGb,
    quotaBytes,
    usedBytes: localUsedBytes,
    remainingBytes,
    percentUsed,
    objectCount: localCount,
    quotaFormatted: formatStorageBytes(quotaBytes),
    usedFormatted: formatStorageBytes(localUsedBytes),
    remainingFormatted: formatStorageBytes(remainingBytes),
    objects: localObjects.sort((a, b) => b.sizeBytes - a.sizeBytes),
    checkedAt,
  };
}
