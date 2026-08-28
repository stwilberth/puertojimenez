export const prerender = false;
import { getNotas, saveNotas } from '../../../lib/notas';
import { isAuthenticated } from '../../../lib/auth';

export async function POST({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }
  try {
    const { id, titulo, contenido } = await request.json();
    if (!titulo?.trim() || !contenido?.trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'Título y contenido requeridos' }), { status: 400 });
    }
    const notas = await getNotas();
    if (id) {
      const idx = notas.findIndex((n) => n.id === id);
      if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'Nota no encontrada' }), { status: 404 });
      notas[idx] = { ...notas[idx], titulo: titulo.trim(), contenido: contenido.trim() };
    } else {
      notas.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fecha: new Date().toISOString(),
      });
    }
    await saveNotas(notas);
    return new Response(JSON.stringify({ ok: true, notas }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
