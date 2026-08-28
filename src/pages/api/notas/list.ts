export const prerender = false;
import { getNotas } from '../../../lib/notas';
import { isAuthenticated } from '../../../lib/auth';

export async function GET({ request }: { request: Request }) {
  if (!isAuthenticated(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 401 });
  }
  try {
    const notas = await getNotas();
    notas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return new Response(JSON.stringify({ ok: true, notas }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
