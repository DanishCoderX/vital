# 💧 Vital — Fitness & Hydration Tracker

A cross-platform fitness and hydration tracker built with Expo — **one codebase, three targets**: iOS, Android, and a static website.

Built for **InternGrow — App Development Track**, Task 3: *Advanced Fitness & Hydration Tracker*.

![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Overview

Instead of treating "web version" and "mobile app" as separate builds, Vital is genuinely one React Native + TypeScript codebase that runs natively on phones *and* compiles to a real website — including graceful fallbacks anywhere a native-only capability (step sensors, background push notifications) doesn't exist in a browser.

## Features

| Feature | Native | Web |
|---|---|---|
| Workout logging (CRUD) | ✅ | ✅ |
| Auto-estimated calories (MET formula × body weight) | ✅ | ✅ |
| Workout quick-log presets | ✅ | ✅ |
| Step tracking | **Automatic** — device pedometer sensor | Manual / increment entry |
| Hydration ring + quick-add + history | ✅ | ✅ |
| Hydration reminders | **Real scheduled notifications**, fire even when the app is closed, with a "+250ml" quick-action button on the notification itself | Browser notifications — fire only while the tab is open |
| Weekly/monthly charts | ✅ | ✅ |
| Achievement badges | ✅ | ✅ |
| Dark mode | ✅ | ✅ |
| CSV export / import | Native share sheet | Direct file download/upload |
| Share weekly summary card | `react-native-view-shot` → share sheet | `html2canvas` → PNG download |
| Rest day tracking (protects hydration streak) | ✅ | ✅ |
| Installable app | Real app via Expo Go / EAS build | Installable as a PWA ("Add to Home Screen") |

## Honest platform notes

A few things are called out explicitly in the UI rather than silently faked:
- **Storage:** the original brief mentions SQLite/Room, which are native-only. Since this app needs to run on web too, it uses `AsyncStorage` instead — functionally equivalent for this app's needs, and it's the same API on every platform.
- **Step counting:** only real phones have a motion sensor. On web, the Steps screen tells you it's manual entry and why.
- **Reminders:** web notifications require the tab to stay open — there's no background push without a server-side push subscription, which is out of scope here. The Settings screen states this plainly.

## Tech Stack

- **Expo (SDK 57) + React Native + TypeScript**
- **React Navigation** (bottom tabs)
- **AsyncStorage** — unified cross-platform persistence
- **react-native-svg** — hydration ring + bar charts
- **expo-notifications** — native scheduled reminders with quick actions
- **expo-sensors** (Pedometer) — automatic step counting on native
- **expo-file-system / expo-sharing / expo-document-picker** — CSV export/import
- **react-native-view-shot** + **html2canvas** — share-card image capture (native / web respectively)

## Getting Started

```bash
npm install
npm start
```

This opens Expo's dev tools. From there:
- Press `w` to run in a browser
- Scan the QR code with the **Expo Go** app on your phone to run it natively (free, no build required)

## Building for web deployment

```bash
npm run build:web
```

Outputs a static site to `dist/` — deploy to Netlify or Vercel like any static site.

## Project Structure

```
src/
├── types/          Core data model
├── lib/
│   ├── store.ts          AsyncStorage data layer + all mutations
│   ├── met.ts             MET calorie estimation
│   ├── notifications.ts   Platform-split reminder scheduling
│   ├── stepSensor.ts       Platform-split pedometer access
│   ├── csv.ts              Export/import, platform-split
│   ├── shareSummary.ts     Platform-split image capture/share
│   └── AppContext.tsx      Central data/theme context
├── theme/           Light/dark design tokens
├── components/      Card, HydrationRing, BarChart, SummaryCard, ScreenContainer
├── screens/         Dashboard, Workouts, Steps, Hydration, Settings
└── navigation/      Bottom tab navigator
```

## Building a downloadable Android APK (no Play Store needed)

The web version can show a "Download for Android" button linking straight to a real, installable `.apk` — no Play Store review, completely free via EAS Build's free tier.

1. **Create a free Expo account** at [expo.dev](https://expo.dev) if you don't have one
2. **Install the EAS CLI and log in:**
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Link this project to your account:**
   ```bash
   eas init
   ```
   This writes a project ID into `app.json` — safe to commit.
4. **Build the APK** (uses the `preview` profile already configured in `eas.json`, which outputs a real `.apk` instead of the Play Store's `.aab` format):
   ```bash
   eas build --platform android --profile preview
   ```
   This runs on Expo's servers (free tier: 15 Android builds/month) — takes roughly 10-20 minutes. You'll get a build page URL to watch progress.
5. **Download the finished APK** from the build page (there's a direct download link once it's done).
6. **Host it somewhere permanent** — the build page's own link expires eventually. Easiest option: create a GitHub Release on your repo and attach the `.apk` file as a release asset; GitHub gives you a permanent download URL.
7. **Wire it up:** open `src/components/DownloadAndroidBanner.tsx` and set:
   ```ts
   export const ANDROID_APK_URL = "https://github.com/DanishCoderX/YourRepo/releases/download/v1.0.0/vital.apk";
   ```
   Rebuild and redeploy the web version — a "Download for Android" banner will now appear at the top of the web app.

**Note for anyone installing the APK:** since it's not from the Play Store, Android will prompt to allow "install from unknown sources" the first time — this is normal for sideloaded apps, not a sign of anything wrong.

## Author

**Daanish** — Full Stack Web Developer (MERN) · Final-year BS Computer Science, COMSATS University Islamabad — Attock Campus
GitHub: [@DanishCoderX](https://github.com/DanishCoderX)

Built as part of the **InternGrow App Development Track**.

## License

MIT — free to use and adapt.
