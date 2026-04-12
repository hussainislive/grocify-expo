# Grocify — Smart Grocery List App

A full-stack mobile app for managing your grocery shopping list with per-user data isolation, real-time sync, and a clean dark-green brand identity.

---

## Author

**Hussain**
- Email: [developer.hussain125@gmail.com](mailto:developer.hussain125@gmail.com)
- GitHub: [github.com/hussainislive](https://github.com/hussainislive)

---

## What is Grocify?

Grocify is a cross-platform grocery list management app built with React Native and Expo. Users sign in with their Google, GitHub, or Apple account and get a completely private, isolated grocery list that syncs across sessions.

Items can be organized by category and priority, toggled as purchased, and cleared in bulk. The backend runs as serverless functions on Vercel, backed by a Neon PostgreSQL database. The Android release APK is built locally with Gradle — no EAS cloud build required.

---

## Features

- Sign in with Google, GitHub, or Apple via Clerk OAuth
- Every user has a completely private, isolated grocery list
- Add items with name, category, quantity, and priority
- Toggle items as purchased; purchased items are visually separated
- Adjust item quantity inline
- Delete individual items or clear all purchased items in bulk
- Dark and light mode following system preference
- Error monitoring and user feedback via Sentry
- Signed Android release APK built entirely locally with Gradle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + React Native |
| Routing | Expo Router (file-based, SSR-capable) |
| Styling | NativeWind (Tailwind CSS for React Native) |
| State management | Zustand |
| Authentication | Clerk (OAuth: Google / GitHub / Apple) |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Backend hosting | Vercel serverless functions |
| Error tracking | Sentry |
| Asset generation | sharp (SVG to PNG) |
| Language | TypeScript |

---

## Project Structure

```
grocify/
├── src/
│   ├── app/
│   │   ├── _layout.tsx                     Root layout — Clerk, Sentry, theme provider
│   │   ├── sso-callback.tsx                Clerk OAuth callback screen
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx                 Auth group layout
│   │   │   └── sign-in.tsx                 Sign-in screen (Google / GitHub / Apple)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx                 Tab layout — injects Clerk JWT into store
│   │   │   ├── index.tsx                   Main grocery list screen
│   │   │   ├── planner.tsx                 Planner screen
│   │   │   └── insights.tsx                Insights and analytics screen
│   │   └── api/                            Expo Router server routes (web / dev only)
│   │       └── items/
│   │           ├── index+api.ts            GET and POST /api/items
│   │           ├── [id]+api.ts             PATCH and DELETE /api/items/:id
│   │           └── clear-purchased+api.ts  POST /api/items/clear-purchased
│   ├── store/
│   │   └── grocery-store.ts               Zustand store — all API calls + auth header
│   ├── lib/
│   │   └── server/
│   │       ├── auth.ts                    JWT decode, 401 helper, input validation
│   │       ├── db-actions.ts              Drizzle query and mutation functions
│   │       └── db/
│   │           ├── client.ts              Neon + Drizzle client
│   │           └── schema.ts              grocery_items table schema
│   └── hooks/
│       └── useSocialAuth.ts              Clerk OAuth hook
│
├── api/                                   Vercel serverless functions (used by native APK)
│   └── items/
│       ├── index.js                       GET + POST — auth protected, per-user
│       ├── [id].js                        PATCH + DELETE — ownership verified
│       └── clear-purchased.js             POST — clears only the requesting user's items
│
├── assets/
│   └── images/
│       ├── grocify-icon.png               1024x1024 app icon
│       ├── grocify-android-foreground.png 432x432 adaptive icon foreground
│       └── grocify-splash.png             Splash screen image
│
├── scripts/
│   └── generate-assets.mjs               Generates icon and splash PNGs from SVG via sharp
│
├── android/                               Generated Android native project (expo prebuild)
│   └── app/
│       ├── build.gradle                   Release signing config
│       ├── grocify-release.keystore       Release keystore (gitignored)
│       └── local.properties              Store and key passwords (gitignored)
│
├── vercel.json                            Vercel build config
├── app.json                               Expo app config
├── tailwind.config.js                     Tailwind / NativeWind config
├── drizzle.config.ts                      Drizzle Kit config
└── .env                                   Environment variables (gitignored)
```

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:pass@host/dbname

# Clerk authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Deployed Vercel API base URL — baked into the native bundle at build time
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app

# Sentry error tracking
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- Expo CLI: `npm install -g expo`
- Android Studio with SDK 36 and NDK 27.1.12297006 (for APK builds)
- Vercel CLI: `npm install -g vercel`
- A Clerk account at clerk.com
- A Neon database at neon.tech

### Install dependencies

```bash
git clone https://github.com/hussainislive/grocify.git
cd grocify
npm install
```

### Set up the database

```bash
npx drizzle-kit push --force
```

### Run in development

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### Regenerate app icon and splash screen

```bash
node scripts/generate-assets.mjs
npx expo prebuild --platform android --clean
```

---

## Deployment

### Backend — Vercel

```bash
vercel --prod
```

The `api/` folder is auto-detected as Vercel serverless functions. Add these environment variables in the Vercel dashboard:

- `DATABASE_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

### Android APK — local Gradle build

1. Make sure `android/local.properties` contains your signing passwords (see Android Signing below).
2. Run the release build:

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

Install on a connected device:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Single-architecture build for faster testing:

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

---

## Android Signing

The release keystore lives at `android/app/grocify-release.keystore` (gitignored). Passwords are stored in `android/local.properties` (also gitignored — never commit this file).

`android/local.properties`:
```
sdk.dir=/Users/you/Library/Android/sdk
GROCIFY_STORE_PASSWORD=your_store_password
GROCIFY_KEY_PASSWORD=your_key_password
```

To generate a fresh keystore:

```bash
keytool -genkeypair \
  -v \
  -keystore android/app/grocify-release.keystore \
  -alias grocify \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_PASSWORD \
  -keypass YOUR_PASSWORD \
  -dname "CN=Grocify, OU=Mobile, O=Grocify, L=City, ST=State, C=US"
```

---

## Architecture

```
React Native App (Expo Router + Zustand + Clerk SDK)
          |
          |  HTTPS — Authorization: Bearer <clerk_jwt>
          v
Vercel Serverless API  (api/items/)
  - Decodes Clerk JWT, extracts userId from sub claim
  - All DB queries filtered by user_id
  - Returns 401 for missing or expired tokens
          |
          |  SQL via Drizzle ORM
          v
Neon PostgreSQL
  grocery_items (id, user_id, name, category,
                 quantity, purchased, priority, updated_at)
```

**Security model:** Every API request must carry a valid Clerk JWT in the `Authorization: Bearer` header. The server decodes the token, extracts the `sub` claim as `userId`, and applies it to every database query. Users can only ever read or modify their own items — even if they somehow know another user's item ID.

---

## Database Schema

```typescript
export const groceryItems = pgTable("grocery_items", {
  id:         text("id").primaryKey(),
  user_id:    text("user_id").notNull(),          // Clerk userId — per-user isolation
  name:       text("name").notNull(),
  category:   text("category").notNull(),          // Produce | Dairy | Bakery | Pantry | Snacks
  quantity:   integer("quantity").default(1),
  purchased:  boolean("purchased").default(false),
  priority:   text("priority").default("medium"),  // low | medium | high
  updated_at: bigint("updated_at").notNull(),      // Unix timestamp in ms
});
```

---

## API Reference

All endpoints require the header `Authorization: Bearer <clerk_jwt>`.

| Method | Path | Description |
|---|---|---|
| GET | /api/items | List all items for the authenticated user |
| POST | /api/items | Create a new item |
| PATCH | /api/items/:id | Update quantity or purchased status |
| DELETE | /api/items/:id | Delete an item |
| POST | /api/items/clear-purchased | Delete all purchased items for the user |

**POST /api/items — request body:**
```json
{
  "name": "Apples",
  "category": "Produce",
  "quantity": 3,
  "priority": "medium"
}
```

**Validation rules:**
- `name` — required, max 100 characters
- `category` — must be one of: Produce, Dairy, Bakery, Pantry, Snacks
- `priority` — must be one of: low, medium, high
- `quantity` — number between 1 and 999

---

## License

MIT
