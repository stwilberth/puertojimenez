import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName, NOTAS_KEY } from './r2';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  fecha: string;
}

function getLocalPath(): string {
  // Usar data/notas.json relativo al proyecto (funciona en SSR con dist/server)
  const cwd = process.cwd();
  // En prod con adapter node, cwd es /var/www/puertojimenez, en dev es igual
  const p1 = path.join(cwd, 'data', 'notas.json');
  const p2 = path.join(cwd, 'src', 'data', 'notas.json');
  // preferir /var/www/puertojimenez/data si existe, sino src/data
  return p1;
}

async function readLocal(): Promise<Nota[]> {
  try {
    const p = getLocalPath();
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt) as Nota[];
  } catch {
    return [];
  }
}

async function writeLocal(notas: Nota[]) {
  const p = getLocalPath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(notas, null, 2), 'utf8');
  // también espejo en src/data para persistencia en repo si existe
  try {
    const p2 = path.join(process.cwd(), 'src', 'data', 'notas.json');
    await fs.mkdir(path.dirname(p2), { recursive: true });
    await fs.writeFile(p2, JSON.stringify(notas, null, 2), 'utf8');
  } catch {}
}

export async function getNotas(): Promise<Nota[]> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: NOTAS_KEY }));
    const body = await res.Body?.transformToString();
    if (!body) return await readLocal();
    return JSON.parse(body) as Nota[];
  } catch (e: any) {
    // Fallback local si R2 no configurado, no existe o Unauthorized (token sin permiso para puertojimenez)
    const status = e.$metadata?.httpStatusCode;
    if (e.name === 'NoSuchKey' || status === 404 || String(e.message).includes('NoSuchKey') || String(e.message).includes('not found')) {
      const local = await readLocal();
      if (local.length) return local;
      return [];
    }
    if (status === 401 || status === 403 || String(e.message).includes('Unauthorized') || String(e.message).includes('Faltan credenciales')) {
      return await readLocal();
    }
    // para otros errores, intenta local como fallback
    try {
      const local = await readLocal();
      if (local.length) return local;
    } catch {}
    if (String(e.message).includes('Faltan credenciales')) return await readLocal();
    throw e;
  }
}

export async function saveNotas(notas: Nota[]) {
  try {
    const client = getR2Client();
    const bucket = getBucketName();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: NOTAS_KEY,
        Body: JSON.stringify(notas, null, 2),
        ContentType: 'application/json',
      })
    );
    // espejo local también para backup
    await writeLocal(notas);
  } catch (e: any) {
    const status = e.$metadata?.httpStatusCode;
    if (status === 401 || status === 403 || String(e.message).includes('Unauthorized') || String(e.message).includes('Faltan credenciales')) {
      await writeLocal(notas);
      return;
    }
    // si es otro error, guarda local y re-lanza solo si no hay fallback
    try {
      await writeLocal(notas);
      // si local ok, no lanzar error para que admin siga funcionando en modo local
      return;
    } catch {}
    throw e;
  }
}
