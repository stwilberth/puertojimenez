export const prerender = false;
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName, WILBERTH_PREFIX, NOTAS_KEY } from '../../../lib/r2';
import { isAuthenticated } from '../../../lib/auth';

export async function POST({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }
  try {
    const { key } = await request.json();
    if (!key || !key.startsWith(WILBERTH_PREFIX)) {
      return new Response(JSON.stringify({ ok: false, error: 'Key inválido' }), { status: 400 });
    }
    if (key === NOTAS_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'No se puede borrar notas.json así' }), { status: 400 });
    }
    try {
      const client = getR2Client();
      const bucket = getBucketName();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (r2Err: any) {
      const status = r2Err.$metadata?.httpStatusCode;
      if (status === 401 || status === 403 || String(r2Err.message).includes('Unauthorized')) {
        // fallback local
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const name = key.replace(WILBERTH_PREFIX, '');
        const candidates = [
          path.join(process.cwd(), 'dist', 'client', 'uploads', WILBERTH_PREFIX, name),
          path.join(process.cwd(), 'data', 'uploads', WILBERTH_PREFIX, name),
        ];
        let deleted = false;
        for (const p of candidates) {
          try { await fs.unlink(p); deleted = true; } catch {}
        }
        if (deleted) return new Response(JSON.stringify({ ok: true, fallback: 'local' }), { headers: { 'Content-Type': 'application/json' } });
        throw r2Err;
      }
      throw r2Err;
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
