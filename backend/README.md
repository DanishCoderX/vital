# Vital Backend

Node/Express + MongoDB auth and sync API for the Vital app.

See the top-level `../README.md` for the full setup walkthrough (MongoDB Atlas, Google OAuth, JWT secret).

## API Reference

### `POST /api/auth/signup`
Body: `{ email, password, name }`
Returns: `{ token, user }`

### `POST /api/auth/login`
Body: `{ email, password }`
Returns: `{ token, user }`

### `POST /api/auth/google`
Body: `{ idToken }` — a Google ID token obtained client-side via `expo-auth-session`, verified server-side before trust.
Returns: `{ token, user }`

### `GET /api/auth/me`
Header: `Authorization: Bearer <token>`
Returns: `{ user }`

### `GET /api/data`
Header: `Authorization: Bearer <token>`
Returns: `{ appData }` — the user's full synced data blob, or `null` if nothing's been pushed yet.

### `PUT /api/data`
Header: `Authorization: Bearer <token>`
Body: `{ appData }`
Overwrites the user's synced data. Whole-document sync — the client always sends its complete current dataset, not a diff.

## Local development

```bash
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npm run dev
```

Runs on `http://localhost:4001` by default.
