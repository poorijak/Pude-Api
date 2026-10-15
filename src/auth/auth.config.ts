export const ACCESS_TOKEN_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;
export const JWT_ISSUER = 'pude-api';
export const JWT_AUDIENCE = 'pude-web';

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function frontendOrigin(): string {
  const url = new URL(process.env.FRONTEND_DOMAIN || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('FRONTEND_DOMAIN must be an HTTP(S) URL');
  }
  return url.origin;
}

export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return '/';
  return value;
}
