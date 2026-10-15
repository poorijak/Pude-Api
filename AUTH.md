# Google authentication

## Configuration

Set these variables in `.env` on the API server:

```dotenv
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_CALLBACK_URL=https://pude-api-dev.bbxst-hub.dev/auth/google/callback
FRONTEND_DOMAIN=http://localhost:3000
JWT_SECRET=<random secret of at least 32 characters>
DATABASE_URL=<PostgreSQL connection URL>
```

Register `GOOGLE_CALLBACK_URL` exactly as an authorized redirect URI in the Google OAuth client. For a local API, use `http://localhost:3001/auth/google/callback` in both `.env` and Google Console. Set `FRONTEND_DOMAIN` to the actual web origin when deploying. Google credentials and JWT secrets must be configured separately in each environment.

## Database

The initial migration creates `User`, `Account`, and `AuthCode`. It does not alter any existing application tables. Apply it to the intended database before starting the API:

```bash
npx prisma migrate deploy
npx prisma generate
```

The development Compose command already runs both commands before starting NestJS. The Jenkins `docker run` deployment must apply migrations separately before starting the new image.

`User` contains the requested fields. `current_level` and `current_stage` start at 1; both streak counters start at 0. `last_practice_date` is a nullable PostgreSQL date. `created` and `updatedDate` are timestamps, with `updatedDate` maintained by Prisma. Login does not change practice progress or streaks.

`Account` links a Google provider ID to a user and keeps the email returned by Google. Accounts are matched by the stable Google ID, not linked automatically by email. Google access and refresh tokens are not stored.

## Login flow

1. Navigate the browser to `GET /auth/google?callBackUrl=/`.
2. Google returns to `GET /auth/google/callback`. The API validates browser-bound OAuth state, creates or updates the user, and redirects to `${FRONTEND_DOMAIN}/api/auth/callback?code=...&return_to=...`.
3. The frontend must implement `/api/auth/callback` and send `POST /auth/exchange` with JSON `{ "code": "..." }` within 30 seconds. Each code can be used once, across API instances. Only its SHA-256 hash is stored in PostgreSQL.
4. The exchange responds with `{ accessToken, refreshToken }` and sets HttpOnly cookies. If a frontend server performs the exchange, it must manage/forward cookies itself. Browser requests to the API should use `credentials: 'include'`.

| Endpoint                    | Behavior                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| `GET /auth/google`          | Start Google login                                               |
| `GET /auth/google/callback` | Validate Google callback and issue one-time code                 |
| `POST /auth/exchange`       | Exchange code and set cookies                                    |
| `GET /auth/me`              | Return current User; accepts access-token cookie or Bearer token |
| `GET /auth/refresh`         | Use refresh-token cookie to issue a new access-token cookie      |
| `POST /auth/signout`        | Clear API authentication cookies                                 |

Access tokens expire after 7 days and refresh tokens after 30 days, matching the reference flow. Refresh tokens cannot authenticate as access tokens. Signout clears cookies; already-issued JWTs remain valid until expiry. Cookie authentication uses `SameSite=Lax` and requires a same-site frontend/API deployment; production cookies use HTTPS. CORS allows only `FRONTEND_DOMAIN`.

The reference application's admin token-issuance endpoint is not included because this schema does not define admin roles.
