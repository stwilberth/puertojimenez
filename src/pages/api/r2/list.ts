export const prerender = false;
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName, getPublicUrl, WILBERTH_PREFIX } from '../../../lib/r2';
import { isAuthenticated } from '../../../lib/auth';

export async function GET({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }

  // Intenta R2, si falla hace fallback a archivos locales en dist/client/uploads y data/uploads
  try {
    const client = getR2Client();
    const bucket = getBucketName();
    const resp = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: WILBERTH_PREFIX,
        MaxKeys: 100,
      })
    );

    const publicUrl = getPublicUrl().replace(/\/$/, '');
    const items = (resp.Contents || [])
      .filter((o) => o.Key && o.Key !== WILBERTH_PREFIX && !o.Key!.endsWith('notas.json'))
      .map((o) => ({
        key: o.Key!,
        size: o.Size,
        lastModified: o.LastModified,
        url: publicUrl ? `${publicUrl}/${o.Key}` : null,
        name: o.Key!.replace(WILBERTH_PREFIX, ''),
      }))
      .sort((a, b) => new Date(b.lastModified as any).getTime() - new Date(a.lastModified as any).getTime());

    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const status = e.$metadata?.httpStatusCode;
    const isAuthErr = status === 401 || status === 403 || String(e.message).includes('Unauthorized') || String(e.message).includes('Faltan credenciales');
    if (isAuthErr) {
      // fallback local
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const candidates = [
          path.join(process.cwd(), 'dist', 'client', 'uploads', WILBERTH_PREFIX),
          path.join(process.cwd(), 'data', 'uploads', WILBERTH_PREFIX),
        ];
        const items: any[] = [];
        for (const dir of candidates) {
          try {
            const files = await fs.readdir(dir);
            for (const f of files) {
              const stat = await fs.stat(path.join(dir, f));
              if (stat.isFile()) {
                items.push({
                  key: `${WILBERTH_PREFIX}${f}`,
                  size: stat.size,
                  lastModified: stat.mtime,
                  url: `/uploads/${WILBERTH_PREFIX}${f}`,
                  name: f,
                });
              }
            }
          } catch {}
        }
        // deduplicar por name
        const uniq = Array.from(new Map(items.map(i=> [i.name, i])).values());
        uniq.sort((a,b)=> new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        return new Response(JSON.stringify({ ok: true, items: uniq, fallback: 'local' }), { headers: { 'Content-Type': 'application/json' } });
      } catch {}
    }
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
