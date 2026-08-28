# R2 + Dashboard Admin - PuertoJimenez.info

Este proyecto ahora guarda imágenes y notas en **Cloudflare R2** bajo la carpeta `wilberth/puertojimenez/`.

Bucket compartido `wilberth` ya contiene:
- `wilberth/leivatours/`
- `wilberth/osafishingprocr/`
- `wilberth/visitranchoquemado/`
- **Nuevo:** `wilberth/puertojimenez/`  ← este proyecto

---

## 1. Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Rellena:

- `R2_ACCOUNT_ID` : ID de cuenta Cloudflare (dashboard R2 > Manage R2 API Tokens)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` : credenciales S3 del token con permisos Object Read & Write sobre `wilberth`
- `R2_BUCKET_NAME=wilberth`
- `R2_PUBLIC_URL` : URL pública del bucket o subdominio R2 con *Public Access Enabled* (ej. `https://pub-abc123.r2.dev` o `https://images.tudominio.com`). Si lo dejas vacío el sitio hace fallback a imágenes locales, pero el dashboard no podrá mostrar URLs copiables.

- `ADMIN_PASSWORD=Jair2018_*` (solo contraseña, sin usuario). Ya está hardcodeado como fallback, pero puedes sobreescribirlo aquí.

> Bucket: **Public Access = Enabled**, Standard, 173.57 MB actual. Asegúrate que el bucket tiene CORS habilitado si usas dominio custom.

---

## 2. Estructura en R2

```
wilberth/puertojimenez/
├── images/
│   ├── golfito-puerto-jimenez-ferry.jpeg
│   ├── ruta-golfito-puerto-jimenez.png
│   ├── horario-tracopa-san-jose-golfito.jpeg
│   ├── horario-tracopa-san-jose-golfito-detalle.jpeg
│   ├── logo-puertojimenez.webp
│   └── default-cover.jpg
├── assets/
│   ├── mapa-golfito-puerto-jimenez.png
│   ├── mapa-puerto-jimenez.jpg
│   ├── artesana-claudia-elizondo.jpg / -productos.jpeg
│   ├── artesana-elizabeth-ramirez.jpg / -productos.jpeg
│   ├── artesano-elmer-rodriguez.jpg / -productos.jpeg
│   ├── artesano-hubert-loria.jpg / -productos.jpeg
│   └── horario-lancha-golfo-dulce.jpeg
├── notas.json   <-- notas del admin (JSON array)
└── <uploads del dashboard> ej: 1714180000000-tour-corcovado.jpg
```

Subidas desde el dashboard van directo a `wilberth/puertojimenez/<timestamp>-<nombre>.ext`

---

## 3. Migrar imágenes actuales del repo a R2

Antes había imágenes en `public/images` y `src/assets`. Para no tenerlas duplicadas en el repositorio:

```bash
pnpm install  # ya incluye @aws-sdk/client-s3 y @astrojs/node
# edita .env con credenciales reales
pnpm run migrate:r2
```

El script `scripts/migrate-images-to-r2.mjs` sube 17 archivos con nombres descriptivos (ver mapeo dentro del script) a `wilberth/puertojimenez/...` y genera `src/data/r2-manifest.json` con las URLs.

Verifica en Cloudflare Dashboard > R2 > wilberth > puertojimenez que aparecen.

**Después de verificar:**
- Puedes borrar `public/images/*` (excepto `favicon.ico` si lo quieres local) y `src/assets/*` para cumplir "no hayan imágenes en el repositorio".
- El código ya tiene fallback: si `R2_PUBLIC_URL` está definido, usa `src/lib/r2-images.ts` (constantes `R2_IMAGES`). Si no, usa rutas locales.
- Para artisans: `src/content/artists/*.md` actualmente apuntan a `../../assets/*.jpeg`. Tras migrar, puedes cambiarlos a URLs de R2 o modificar `src/content/config.ts` para aceptar `z.string().url()` y usar `R2_IMAGES` directamente en `src/pages/artisans.astro` y `src/pages/index.astro`.

Si borras los assets, elimina los `import puertoJimenezMap from '../assets/...'` y usa solo `R2_IMAGES` (ya está preparado en `src/pages/getting-puerto-jimenez-by-bus.astro` y `src/pages/index.astro` + `HubCard.astro` que ahora acepta `string | ImageMetadata`).

---

## 4. Dashboard Admin

**Ruta:** `https://tudominio.com/admin`

- Login solo pide **contraseña**: `Jair2018_*` (o la que pongas en `ADMIN_PASSWORD`).
- Al logearse se fija cookie `admin_auth=auth_ok` HttpOnly 7 días (validada en cada API).
- Tabs:
  - **Imágenes:** drag&drop, input *Nombre* (opcional, se sanitiza a `nombre-ext.jpg`), preview, botón *Subir a R2*. Galería lista imágenes de `wilberth/puertojimenez/` (excluye `notas.json`) con Ver / Copiar URL / Borrar.
  - **Notas:** formulario Título + Contenido → guarda en `wilberth/puertojimenez/notas.json` (array JSON). Lista con Editar / Borrar.

APIs (requieren cookie auth):
- `POST /api/admin/login` `{password}`
- `POST /api/admin/logout`
- `GET /api/admin/check`
- `POST /api/r2/upload` formData `file` + `nombre`
- `GET /api/r2/list`
- `POST /api/r2/delete` `{key}`
- `GET /api/notas/list`
- `POST /api/notas/save` `{id?, titulo, contenido}`
- `POST /api/notas/delete` `{id}`

Todo validado en `src/lib/auth.ts` (`isValidPassword` compara con `ADMIN_PASSWORD`).

---

## 5. Astro config

`astro.config.mjs` está en `output: 'hybrid'` + `adapter: node` (standalone) para que `/admin` y `/api/*` sean SSR y el resto siga siendo SSG.

Si despliegas en **Cloudflare Pages/Workers**, cambia el adapter:

```js
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare(),
})
```

Y ajusta `image.domains` si tu `R2_PUBLIC_URL` usa dominio custom.

Build:

```bash
pnpm build
node ./dist/server/entry.mjs # en Node adapter
```

---

## 6. Próximos pasos recomendados

- Configurar CORS en R2 si el frontend necesita fetch directo (no necesario con proxy vía API).
- Activar cache en R2_PUBLIC_URL (Cloudflare CDN).
- Borrar del repo `public/images` y `src/assets` tras confirmar migración exitosa y pasar a solo R2.
- Opcional: conectar `notas.json` a una sección pública `/notas` si quieres mostrarlas en el sitio.
