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
