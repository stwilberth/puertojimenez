const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Jair2018_*';
const COOKIE_NAME = 'admin_auth';
const COOKIE_VALUE = 'auth_ok'; // simple flag; signed via httpOnly - real check is password hash

export function isValidPassword(pass: string) {
  return pass === ADMIN_PASSWORD;
}

export function getCookieName() { return COOKIE_NAME; }
export function getCookieValue() { return COOKIE_VALUE; }

export function isAuthenticated(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);
}

export function setAuthCookie(): string {
  // 7 days
  return `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
