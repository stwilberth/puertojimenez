export const prerender = false;
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName, WILBERTH_PREFIX } from '../../../lib/r2';
import { isAuthenticated } from '../../../lib/auth';

function sanitizeFilename(name: string) {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase() || 'imagen';
}

export async function POST({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let nombre = (formData.get('nombre') as string | null)?.trim() || '';

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No se recibió archivo' }), { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ ok: false, error: 'Solo se permiten imágenes' }), { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ ok: false, error: 'Máximo 15MB' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const baseName = sanitizeFilename(nombre || file.name.replace(/\.[^/.]+$/, ''));
    const finalName = baseName.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`;
    const key = `${WILBERTH_PREFIX}${Date.now()}-${finalName}`;

    // Intenta R2, si falla con 401/403 (token sin permiso para puertojimenez) hace fallback local
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Buffer.from(arrayBuffer),
          ContentType: file.type,
        })
      );
    } catch (r2Err: any) {
      const status = r2Err.$metadata?.httpStatusCode;
      const isAuthErr = status === 401 || status === 403 || String(r2Err.message).includes('Unauthorized') || String(r2Err.message).includes('Faltan credenciales');
      if (!isAuthErr) throw r2Err;
      // fallback local: guarda en data/uploads (persistente) y también intenta dist/client para compatibilidad
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const fileNameFromKey = key.replace(WILBERTH_PREFIX, ''); // ya incluye timestamp
      const dataDir = path.join(process.cwd(), 'data', 'uploads', WILBERTH_PREFIX);
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(path.join(dataDir, fileNameFromKey), Buffer.from(arrayBuffer));
      // intento best-effort en dist/client (puede fallar por permisos tras build)
      try {
        const localDir = path.join(process.cwd(), 'dist', 'client', 'uploads', WILBERTH_PREFIX);
        await fs.mkdir(localDir, { recursive: true });
        await fs.writeFile(path.join(localDir, fileNameFromKey), Buffer.from(arrayBuffer));
      } catch {}
      // Retorna key y url correcta (servida via Alias /uploads -> data/uploads)
      return new Response(JSON.stringify({ ok: true, key, filename: fileNameFromKey, fallback: 'local', url: `/uploads/${key}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, key, filename: finalName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('R2 upload error', e);
    return new Response(JSON.stringify({ ok: false, error: e.message || 'Error al subir' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
