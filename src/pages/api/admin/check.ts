export const prerender = false;
import { isAuthenticated } from '../../../lib/auth';

export async function GET({ request }: { request: Request }) {
  return new Response(JSON.stringify({ ok: isAuthenticated(request) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
