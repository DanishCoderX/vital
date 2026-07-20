# 💧 Vital — Fitness & Hydration Tracker

A cross-platform fitness and hydration tracker — one Expo codebase for iOS, Android, and web — with real user accounts and automatic cross-device sync.

Built for **InternGrow — App Development Track**, Task 3: *Advanced Fitness & Hydration Tracker*.

## Project structure

```
vital/
├── app/        Expo (React Native + TypeScript) — the actual app, runs on iOS/Android/web
└── backend/    Node/Express + MongoDB — auth + data sync API
```

## What's new: accounts + sync

Every user creates an account (email/password or Google) on first launch. Their weight is collected at sign-up. From then on, their data automatically syncs to their account — log in on any device and their workouts, hydration history, steps, and settings are all there.

- **Local-first:** every action still writes instantly to on-device storage, so the app feels the same as before — no waiting on network requests to see your own data
- **Background sync:** changes push to the backend automatically (debounced ~1.5s after your last action) whenever you're signed in
- **On login:** existing accounts pull their synced data down and it becomes the local copy; brand-new accounts start empty (pre-existing local data on a device is intentionally not imported into a new account)

## Setup — full walkthrough

### 1. MongoDB Atlas (free tier)
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Under "Connect" → "Drivers", copy your connection string
3. In `backend/.env` (copy from `.env.example`), set `MONGODB_URI` to that string

### 2. Google OAuth (for Google sign-in)
1. Go to [Google Cloud Console](https://console.cloud.google.com) → create a project (or use an existing one)
2. **APIs & Services → OAuth consent screen** → configure it (External, add your email as a test user while in testing mode)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** — you'll need to create **three** client IDs:
   - **Web application** (used for the web build, and by the backend to verify tokens from any platform)
   - **Android** (package name: `com.danishcoderx.vitaltracker` — matches `app.json`)
   - **iOS** (bundle ID: same package name, adjust in `app.json` under `ios.bundleIdentifier` if needed)
4. Copy the **Web client ID** into `backend/.env` as `GOOGLE_CLIENT_ID`
5. Copy all three client IDs into `app/src/components/GoogleSignInButton.tsx`:
   ```ts
   const GOOGLE_WEB_CLIENT_ID = "...";
   const GOOGLE_IOS_CLIENT_ID = "...";
   const GOOGLE_ANDROID_CLIENT_ID = "...";
   ```

### 3. JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the output into `backend/.env` as `JWT_SECRET`.

### 4. Run the backend
```bash
cd backend
npm install
npm run dev
```

### 5. Run the app
```bash
cd app
npm install
npm start
```
Press `w` for web, or scan the QR code with **Expo Go** for native.

## Deployment

- **Backend → Railway.** Root directory: `backend`. Environment variables: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`.
- **Web app → Netlify/Vercel.** Build command: `npm run build:web` (inside `app/`). Set `EXPO_PUBLIC_API_BASE_URL` to your Railway backend's URL + `/api`.
- **Android APK** → see `app/README.md`'s EAS Build section for a free, directly-downloadable `.apk`.

## Security notes

- Passwords are hashed with `bcrypt` (cost factor 12), never stored or logged in plain text
- Google ID tokens are verified server-side against Google's own servers before being trusted — the backend never just accepts a client's claimed identity
- JWTs expire after 30 days
- Data sync is whole-document, last-write-wins — fine for a single-user personal tracker, not designed for simultaneous multi-device editing of the same fields

## Author

**Daanish** — Full Stack Web Developer (MERN) · Final-year BS Computer Science, COMSATS University Islamabad — Attock Campus
GitHub: [@DanishCoderX](https://github.com/DanishCoderX)

Built as part of the **InternGrow App Development Track**.

## License

MIT — free to use and adapt.
