/**
 * URLs de imágenes migradas a R2: wilberth/puertojimenez/
 * Usa R2_PUBLIC_URL (definida en .env) como base.
 * Si no hay R2_PUBLIC_URL, hace fallback a rutas locales para no romper build.
 */
function getPublicBase() {
  const url = (import.meta.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  return url;
}

export function r2Image(path: string) {
  const base = getPublicBase();
  if (!base) return `/${path}`; // fallback local (antes de migrar)
  // path esperado sin leading slash, ej: wilberth/puertojimenez/images/xxx
  return `${base}/${path.replace(/^\//, '')}`;
}

// Mapa con nombres descriptivos (mismo que scripts/migrate-images-to-r2.mjs)
export const R2_IMAGES = {
  // public/images
  ferryGolfito: r2Image('puertojimenez/images/golfito-puerto-jimenez-ferry.jpeg'),
  rutaGolfito: r2Image('puertojimenez/images/ruta-golfito-puerto-jimenez.png'),
  tracopa: r2Image('puertojimenez/images/horario-tracopa-san-jose-golfito.jpeg'),
  tracopaDetalle: r2Image('puertojimenez/images/horario-tracopa-san-jose-golfito-detalle.jpeg'),
  logo: r2Image('puertojimenez/images/logo-puertojimenez.webp'),
  defaultCover: r2Image('puertojimenez/images/default-cover.jpg'),

  // src/assets
  mapaGolfito: r2Image('puertojimenez/assets/mapa-golfito-puerto-jimenez.png'),
  mapaPuertoJimenez: r2Image('puertojimenez/assets/mapa-puerto-jimenez.jpg'),
  claudia: r2Image('puertojimenez/assets/artesana-claudia-elizondo.jpg'),
  claudiaProductos: r2Image('puertojimenez/assets/artesana-claudia-elizondo-productos.jpeg'),
  elizabeth: r2Image('puertojimenez/assets/artesana-elizabeth-ramirez.jpg'),
  elizabethProductos: r2Image('puertojimenez/assets/artesana-elizabeth-ramirez-productos.jpeg'),
  elmer: r2Image('puertojimenez/assets/artesano-elmer-rodriguez.jpg'),
  elmerProductos: r2Image('puertojimenez/assets/artesano-elmer-rodriguez-productos.jpeg'),
  hubert: r2Image('puertojimenez/assets/artesano-hubert-loria.jpg'),
  hubertProductos: r2Image('puertojimenez/assets/artesano-hubert-loria-productos.jpeg'),
  lanchaHorario: r2Image('puertojimenez/assets/horario-lancha-golfo-dulce.jpeg'),
} as const;

// Para artesanos: helpers por nombre
export function artesanoImage(nombre: string, tipo: 'retrato' | 'productos') {
  const key = nombre.toLowerCase();
  if (key.includes('claudia')) return tipo === 'productos' ? R2_IMAGES.claudiaProductos : R2_IMAGES.claudia;
  if (key.includes('elizabeth')) return tipo === 'productos' ? R2_IMAGES.elizabethProductos : R2_IMAGES.elizabeth;
  if (key.includes('elmer')) return tipo === 'productos' ? R2_IMAGES.elmerProductos : R2_IMAGES.elmer;
  if (key.includes('hubert')) return tipo === 'productos' ? R2_IMAGES.hubertProductos : R2_IMAGES.hubert;
  return tipo === 'productos' ? R2_IMAGES.defaultCover : R2_IMAGES.defaultCover;
}
