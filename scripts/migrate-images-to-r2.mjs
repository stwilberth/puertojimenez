#!/usr/bin/env node
/**
 * Migra imágenes actuales del repositorio a R2
 * Destino: wilberth/puertojimenez/
 * Uso: pnpm run migrate:r2  (requiere .env con R2_*)
 *
 * Nombres descriptivos definidos abajo. Sube con PutObject.
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Cargar .env si existe (Node 20+ tiene loadEnvFile)
try {
  if (fs.existsSync(path.join(root, '.env'))) {
    const envText = fs.readFileSync(path.join(root, '.env'), 'utf8');
    for (const line of envText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch {}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('❌ Faltan variables R2 en .env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
  console.error('   Crea .env a partir de .env.example');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const PREFIX = 'puertojimenez/';

// Mapeo: origen local -> destino en R2 con nombre descriptivo
const mappings = [
  // public/images
  { src: 'public/images/de-golfito-a-puerto-jimenez.jpeg', dest: `${PREFIX}images/golfito-puerto-jimenez-ferry.jpeg`, contentType: 'image/jpeg' },
  { src: 'public/images/golfito_to_puerto_jimenez.png', dest: `${PREFIX}images/ruta-golfito-puerto-jimenez.png`, contentType: 'image/png' },
  { src: 'public/images/tracopa.jpeg', dest: `${PREFIX}images/horario-tracopa-san-jose-golfito.jpeg`, contentType: 'image/jpeg' },
  { src: 'public/images/tracopa_2.jpeg', dest: `${PREFIX}images/horario-tracopa-san-jose-golfito-detalle.jpeg`, contentType: 'image/jpeg' },
  { src: 'public/images/logo.webp', dest: `${PREFIX}images/logo-puertojimenez.webp`, contentType: 'image/webp' },
  { src: 'public/images/default.jpg', dest: `${PREFIX}images/default-cover.jpg`, contentType: 'image/jpeg' },
  // src/assets
  { src: 'src/assets/golfito_to_puerto_jimenez1.png', dest: `${PREFIX}assets/mapa-golfito-puerto-jimenez.png`, contentType: 'image/png' },
  { src: 'src/assets/puerto_jimenez_map.jpg', dest: `${PREFIX}assets/mapa-puerto-jimenez.jpg`, contentType: 'image/jpeg' },
  { src: 'src/assets/claudia_elizondo.jpeg', dest: `${PREFIX}assets/artesana-claudia-elizondo.jpg`, contentType: 'image/jpeg' },
  { src: 'src/assets/claudia_elizondo_products.jpeg', dest: `${PREFIX}assets/artesana-claudia-elizondo-productos.jpeg`, contentType: 'image/jpeg' },
  { src: 'src/assets/elizabeth_ramirez.jpeg', dest: `${PREFIX}assets/artesana-elizabeth-ramirez.jpg`, contentType: 'image/jpeg' },
  { src: 'src/assets/elizabeth_ramirez_products.jpeg', dest: `${PREFIX}assets/artesana-elizabeth-ramirez-productos.jpeg`, contentType: 'image/jpeg' },
  { src: 'src/assets/elmer_rodriguez.jpeg', dest: `${PREFIX}assets/artesano-elmer-rodriguez.jpg`, contentType: 'image/jpeg' },
  { src: 'src/assets/elmer_rodriguez_products.jpeg', dest: `${PREFIX}assets/artesano-elmer-rodriguez-productos.jpeg`, contentType: 'image/jpeg' },
  { src: 'src/assets/hubert_loria.jpg', dest: `${PREFIX}assets/artesano-hubert-loria.jpg`, contentType: 'image/jpeg' },
  { src: 'src/assets/hubert_loria_products.jpeg', dest: `${PREFIX}assets/artesano-hubert-loria-productos.jpeg`, contentType: 'image/jpeg' },
  { src: 'src/assets/WhatsApp Image 2026-04-23 at 8.09.34 PM.jpeg', dest: `${PREFIX}assets/horario-lancha-golfo-dulce.jpeg`, contentType: 'image/jpeg' },
];

let ok = 0, skip = 0, fail = 0;
for (const m of mappings) {
  const fullSrc = path.join(root, m.src);
  if (!fs.existsSync(fullSrc)) {
    console.warn(`⚠️  No existe: ${m.src} -> skip`);
    skip++;
    continue;
  }
  const body = fs.readFileSync(fullSrc);
  try {
    // opcional: verificar si ya existe y tiene mismo tamaño -> skip
    // await client.send(new HeadObjectCommand({ Bucket: bucket, Key: m.dest }));
    // console.log(`= Ya existe ${m.dest} (se sobrescribirá)`);

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: m.dest,
      Body: body,
      ContentType: m.contentType,
    }));
    const url = publicUrl ? `${publicUrl}/${m.dest}` : `r2://${bucket}/${m.dest}`;
    console.log(`✅ ${m.src} -> ${m.dest} (${(body.length/1024).toFixed(1)} KB) ${publicUrl ? '→ ' + url : ''}`);
    ok++;
  } catch (e) {
    console.error(`❌ Error subiendo ${m.src} -> ${m.dest}:`, e.message);
    fail++;
  }
}

console.log(`\nResumen: ${ok} subidos, ${skip} omitidos, ${fail} fallidos. Prefijo: ${PREFIX}`);
if (publicUrl) console.log(`Base pública: ${publicUrl}/${PREFIX}`);
else console.log('Define R2_PUBLIC_URL en .env para obtener URLs públicas (ej: https://<subdominio>.r2.dev o dominio custom)');

const manifest = Object.fromEntries(mappings.map(m => [m.src, publicUrl ? `${publicUrl}/${m.dest}` : m.dest]));
fs.writeFileSync(path.join(root, 'src/data/r2-manifest.json'), JSON.stringify({ prefix: PREFIX, bucket, publicUrl, mappings: manifest }, null, 2));
console.log('📄 Manifest escrito en src/data/r2-manifest.json');
