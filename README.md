# 💧 Vital — Fitness & Hydration Tracker

A cross-platform fitness and hydration tracker — one Expo codebase for iOS, Android, and a real website — with user accounts, automatic cross-device sync, and native features that gracefully degrade to sensible web equivalents where the browser can't do what a phone can.

Built for **InternGrow — App Development Track**, Task 3: *Advanced Fitness & Hydration Tracker*.

![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## 🔗 Live

- **Web app:** [vital-ivory-tau.vercel.app](https://vital-ivory-tau.vercel.app)
- **API:** [vital-backend.bonto.run](https://vital-backend.bonto.run)
- **Android:** downloadable APK linked from the web app's banner (built via EAS)

## Project structure

```
vital/
├── app/        Expo (React Native + TypeScript) — the actual app, runs on iOS/Android/web
└── backend/    Node/Express + MongoDB — auth, sync, and password reset API
```

## Features

### Accounts & sync
- Email/password signup and login, plus **Google Sign-In** (native + web)
- **Forgot password** — emailed 6-digit reset code, no deep-linking complexity
- **Change password** while logged in
- **Delete account** — permanently removes the account and all synced data, with a confirmation step
- Data automatically syncs across every device you log into
- **Offline-resilient login** — reopening the app without a connection uses your last-known session instead of logging you out
- Weight collected at sign-up, feeding directly into calorie accuracy

### Workouts
- Full CRUD (add, edit, delete)
- 8 workout types with auto-estimated calories (MET formula × your body weight, still manually editable)
- Quick-log presets — save a workout as a one-tap shortcut

### Steps
- **Native:** automatic tracking via the device's motion sensor (with a proper Activity Recognition permission request)
- **Web:** manual entry / quick-increment buttons, since browsers have no step sensor

### Hydration
- Animated SVG progress ring
- Quick-add buttons + custom amount
- Daily history log
- Custom daily goal

### Reminders
- **Native:** real scheduled notifications, fire even when the app's closed, with a "+250ml" quick-action button on the notification itself
- **Web:** browser notifications while the tab's open — clearly labeled as a browser limitation, not hidden

### Dashboard & insights
- Today's calories, steps, hydration at a glance
- Weekly/monthly chart toggle
- Hydration streak tracker (current + longest)
- Rest days — protect your streak without breaking it

### Achievements
- 6 auto-checked badges based on your real logged data

### Personalization
- Full light/dark theme with a genuinely distinct dark palette, not just inverted colors

### Data portability
- CSV export (all data types) and import (merges into existing data)
- Share a weekly summary card as an image

### Cross-platform by design
- One codebase → iOS, Android, and a real website
- Installable as a PWA on web
- Downloadable Android APK linked from the web app

## Honest platform notes

A few things are called out explicitly in the UI rather than silently faked:
- **Storage:** uses `AsyncStorage` instead of the brief's suggested SQLite/Room, since SQLite doesn't exist in a browser and this app genuinely needs to run on both.
- **Step counting:** only real phones have a motion sensor — the web version says so and offers manual entry instead.
- **Reminders:** web notifications require the tab to stay open — there's no background push without a server-side push subscription, which is out of scope here.

## Tech Stack

**Frontend:** Expo (SDK 57), React Native, TypeScript, React Navigation, `react-native-svg`, `expo-notifications`, `expo-sensors`, `expo-auth-session`, `expo-file-system` / `expo-sharing` / `expo-document-picker`, `react-native-view-shot` + `html2canvas`

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, `google-auth-library`, Nodemailer (Gmail SMTP)

**Persistence:** `AsyncStorage` (instant local reads/writes) with debounced background sync to the backend when signed in

## Setup

### 1. MongoDB Atlas (free tier)
Create a free cluster, get your connection string, and set it as `MONGODB_URI`.

### 2. Google OAuth
Create Web, Android, and iOS OAuth client IDs in Google Cloud Console. The Web client ID goes in the backend's `.env`; all three go into `app/src/components/GoogleSignInButton.tsx`. See `backend/README.md` for the full walkthrough, including the Android-specific custom URI scheme requirement.

### 3. Gmail SMTP (for password reset emails)
Enable 2-Step Verification on a Gmail account, generate an App Password, and set `GMAIL_USER` / `GMAIL_APP_PASSWORD`. Without these, reset codes are logged to the server console instead of emailed — fine for local testing.

### 4. JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run it
```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in the values above
npm install
npm run dev

# Terminal 2 — app
cd app
npm install
npm start
```
Press `w` for web, or scan the QR code with **Expo Go** for native — completely free, no build required.

## Deployment

- **Backend** → any Node host (deployed here on Bonto; Railway also works). Set the same env vars as `.env.example`.
- **Web app** → Vercel/Netlify. Build command: `npm run build:web` (inside `app/`). Set `EXPO_PUBLIC_API_BASE_URL` to your backend's URL + `/api`.
- **Android APK** → `eas build --platform android --profile preview` (free tier, no Play Store needed). See `app/README.md` for the full walkthrough, including hosting the resulting `.apk` as a GitHub Release for a permanent download link.

## Author

**Daanish** — Full Stack Web Developer (MERN) · Final-year BS Computer Science, COMSATS University Islamabad — Attock Campus
GitHub: [@DanishCoderX](https://github.com/DanishCoderX)

Built as part of the **InternGrow App Development Track**.

## License

MIT — free to use and adapt.
