export const prerender = false;
import { isValidPassword, setAuthCookie } from '../../../lib/auth';

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json().catch(async () => {
      const form = await request.formData();
      return { password: form.get('password') };
    });
    const password = (body as any)?.password || '';

    if (!isValidPassword(String(password))) {
      return new Response(JSON.stringify({ ok: false, error: 'Contraseña incorrecta' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setAuthCookie(),
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
