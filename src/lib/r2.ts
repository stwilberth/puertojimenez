import { S3Client } from '@aws-sdk/client-s3';

export function getR2Client() {
  const accountId = import.meta.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Faltan credenciales R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getBucketName() {
  const bucket = import.meta.env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('Falta R2_BUCKET_NAME');
  return bucket;
}

export function getPublicUrl() {
  return import.meta.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';
}

export const WILBERTH_PREFIX = 'puertojimenez/';
export const NOTAS_KEY = 'puertojimenez/notas.json';

// Helper para construir URL pública de un objeto en R2
export function r2Url(key: string) {
  const base = getPublicUrl().replace(/\/$/, '');
  if (!base) return `/${key}`; // fallback relativo si no hay R2_PUBLIC_URL
  return `${base}/${key}`;
}

// Prefijo completo para imágenes del proyecto (para uso en frontend)
export const R2_PREFIX_PUERTOJIMENEZ = 'puertojimenez/';
