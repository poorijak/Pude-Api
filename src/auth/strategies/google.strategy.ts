import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { requiredEnv } from '../auth.config';
import type { GoogleUser } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
      callbackURL: requiredEnv('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    if (!profile.id)
      throw new UnauthorizedException('Missing Google account ID');
    return {
      provider: 'google',
      providerAccountId: profile.id,
      name: profile.name?.givenName || profile.displayName || '',
      surname: profile.name?.familyName || '',
      email: profile.emails?.[0]?.value || null,
    };
  }
}
