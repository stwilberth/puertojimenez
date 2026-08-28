export const prerender = false;
import { getNotas, saveNotas } from '../../../lib/notas';
import { isAuthenticated } from '../../../lib/auth';

export async function POST({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }
  try {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'ID requerido' }), { status: 400 });
    const notas = await getNotas();
    const filtered = notas.filter((n) => n.id !== id);
    if (filtered.length === notas.length) return new Response(JSON.stringify({ ok: false, error: 'No encontrada' }), { status: 404 });
    await saveNotas(filtered);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
