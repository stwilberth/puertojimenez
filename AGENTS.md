# AGENTS.md — PuertoJimenez.info

Instrucciones para la IA que trabaja sobre este repositorio.

## Proyecto

Sitio estático **Astro 5** + **Tailwind** + **React** para turismo en Puerto Jiménez (gateway Corcovado). Desplegado en **Apache** `puertojimenez.info` (`DocumentRoot /var/www/puertojimenez/dist/client`, Proxy `/api` → Node `:3002`).

- Package manager: **pnpm**
- Build: `pnpm build` (genera `dist/client` + `dist/server` con `@astrojs/node`)
- SSR: `systemd puertojimenez-ssr.service` → `node ./dist/server/entry.mjs` en `127.0.0.1:3002` (ver `R2_SETUP.md`)
- Imágenes: **Cloudflare R2** bucket `wilberth` (ver `cloudflare.md` global)

## Tokens globales (ver /var/www/.config/opencode/cloudflare.md)

- **Account ID:** `fef68f2ef09a1b432764edcf35b21cc5`
- **API Token (all_domains):** `redacted` — permisos `Zone`, `Cache Purge`, `DNS`, no `R2 Admin`. Sirve para `wrangler r2 object put --remote` y purgar cache, pero **no** para crear S3 Access Keys. Para S3 `R2_ACCESS_KEY_ID=...` está revocado (401).
- **R2 Endpoint:** `https://fef68f2ef09a1b432764edcf35b21cc5.r2.cloudflarestorage.com`
- **CDN:** `https://cdn.wilberth.com` → bucket `wilberth`
- **Prefijo proyecto:** `puertojimenez/` (hermano de `leivatours/`, `osafishingprocr/`, `visitranchoquemado/`)
- **Zone puertojimenez.info:** `77def1dac66f5c67e9d40bda6087bc15` — purgar con `POST /zones/77def1dac66f5c67e9d40bda6087bc15/purge_cache {"purge_everything":true}`

## R2 - Imágenes y notas

- Uploads del dashboard (`/admin` contraseña `Jair2018_*` sin usuario) van a `puertojimenez/` en R2, fallback local `data/uploads/puertojimenez/` + `Alias /uploads` si R2 401.
- Notas guardadas en `puertojimenez/notas.json` (fallback `data/notas.json`).
- Migración inicial 2026-08-27 vía `wrangler` (17 imágenes + `1787800758850-hubert.jpeg` para Hubert) ya en R2. Script `scripts/migrate-images-to-r2.mjs` requiere S3 keys válidas; actualmente solo funciona via `wrangler --remote` con token global.
- Para crear nuevo S3 key con permiso `puertojimenez/*`, usar Dashboard Cloudflare → R2 → Manage R2 API Tokens → Object Read & Write sobre `wilberth`.

## Comandos

| Tarea | Comando |
|-------|---------|
| Dev | `pnpm dev` |
| Build | `pnpm build` |
| Migrar imágenes a R2 (requiere S3 keys válidas o wrangler) | `pnpm run migrate:r2` o `CLOUDFLARE_API_TOKEN=... npx wrangler r2 object put wilberth/puertojimenez/... --file=... --remote` |
| Reiniciar SSR | `systemctl restart puertojimenez-ssr` |
| Ver logs SSR | `journalctl -u puertojimenez-ssr -f` |
| Purgar Cloudflare | `curl -X POST -H "Authorization: Bearer $CF_TOKEN" https://api.cloudflare.com/client/v4/zones/77def1dac66f5c67e9d40bda6087bc15/purge_cache -d '{"purge_everything":true}'` |

## Reglas

- No romper `DocumentRoot` ni `ProxyPass /api` en `puertojimenez.conf`.
- Cambios en `src/content/artists/hubert-loria.md` requieren rebuild (ahora override a `/uploads/puertojimenez/1787800758850-hubert.jpeg` vía código).
- Verificación obligatoria: `pnpm build` + `curl https://puertojimenez.info/admin/` 200 y `https://puertojimenez.info/uploads/...` 200.
- Commits cortos `feat:`/`fix:` sin secretos.

## Estado actual 2026-08-27

- Imagen Hubert cambiada de `/_astro/hubert_loria.CBeNHfZi_XTSvk.webp` a `/uploads/puertojimenez/1787800758850-hubert.jpeg` (ver `artisans.astro` y `index.astro`).
- Dashboard `/admin/` con notas fallback local funcionando (probado `probando notas/hola`).
- R2 `puertojimenez/` poblado vía wrangler, visible en `cdn.wilberth.com/puertojimenez/...` tras purge.
