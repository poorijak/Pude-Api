import type { Request } from 'express';

export type GoogleUser = {
  provider: 'google';
  providerAccountId: string;
  name: string;
  surname: string;
  email: string | null;
};

export type TokenPayload = {
  sub: string;
  type: 'access' | 'refresh';
};

export type OAuthState = {
  type: 'oauth-state';
  nonce: string;
  returnTo: string;
};

export type GoogleRequest = Request & {
  user: GoogleUser;
  oauthReturnTo?: string;
};

export type AuthRequest = Request & {
  user: { userId: string };
};

export function readCookie(req: Request, name: string): string | null {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];
  return typeof value === 'string' ? value : null;
}

export function extractOptionalUserId(
  req?: Request,
  explicitUserId?: string,
): string | undefined {
  if (
    explicitUserId &&
    typeof explicitUserId === 'string' &&
    explicitUserId.trim()
  ) {
    return explicitUserId.trim();
  }

  if (!req) return undefined;

  const headerUserId = req.headers['x-user-id'];
  if (typeof headerUserId === 'string' && headerUserId.trim()) {
    return headerUserId.trim();
  }

  const cookieUserId = readCookie(req, 'userId');
  if (cookieUserId && cookieUserId.trim()) {
    return cookieUserId.trim();
  }

  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

    if (!token) {
      token = readCookie(req, 'accessToken') ?? undefined;
    }

    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf8'),
        ) as { sub?: string };
        if (payload.sub && typeof payload.sub === 'string') {
          return payload.sub;
        }
      }
    }
  } catch {
    // Ignore any token decoding error
  }

  return undefined;
}
