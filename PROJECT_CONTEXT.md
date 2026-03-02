# Rajkumar Bhaiya — Dating App Project Context

## Overview
A cross-platform dating app built with **React Native + Expo**, using **Firebase** (Auth, Firestore, Storage) as the backend. The V2 pivot moved away from "endless swiping" toward a more interactive, gamified experience.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| App Framework | React Native + Expo (Expo Go for dev) |
| Language | JavaScript (no TypeScript) |
| Backend/Auth | Firebase Auth (email/password) |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| Navigation | React Navigation (Native Stack + Bottom Tabs) |
| Animations | React Native Reanimated + Gesture Handler |
| Audio | expo-av |
| Image Handling | expo-image-picker + expo-image-manipulator |
| Haptics | expo-haptics |

---

## Project Structure

```
src/
├── components/        # Reusable UI: Button, Card, TextField, Chip, VoiceRecorder, ProgressDots
├── config/            # firebase.js (Auth, Firestore, Storage initialization)
├── data/              # defaults.js (default prompts, etc.)
├── navigation/        # RootNavigator, OnboardingNavigator, TabsNavigator
├── screens/
│   ├── auth/          # SignupScreen, LoginScreen
│   ├── onboarding/    # SignupBasicsScreen → NameAgeScreen → PhotosPromptsScreen → VibeOnboardingScreen → OnboardingDoneScreen
│   ├── tabs/          # SwipeScreen, ProfileTab, MatchesScreen, CircleScreen, ChatListScreen
│   ├── profile/       # EditPhotosScreen, EditPromptsScreen, EditVibeScreen, EditIntentsScreen, EditBubblesScreen
│   └── admin/         # AdminHomeScreen, ConfigEditorScreen
├── services/
│   ├── authService.js      # signup, login, logout
│   ├── userService.js      # getUid, updateUser, getUser
│   ├── storageService.js   # uploadProfilePhoto, uploadAllPhotos, deleteProfilePhoto (Firebase Storage)
│   ├── matchService.js     # like, pass, check matches
│   ├── swipeService.js     # recordSwipe
│   ├── configService.js    # loadConfig from app_config/public
│   ├── adminService.js     # admin read/write to app_config
│   ├── imagePicker.js      # pickImageCompressed (1080px JPEG)
│   ├── locationService.js  # getCurrentLatLng
│   ├── profileCompletion.js # computeProfileComplete (V2: name, dobISO, gender, interestedIn)
│   └── resetService.js     # resetMySwipes (dev/testing)
├── state/
│   └── appState.js    # AppStateProvider (global app state context)
└── theme/
    ├── colors.js       # lightColors, darkColors, colors (dark fallback)
    ├── ThemeContext.js # ThemeProvider, useTheme hook
    ├── spacing.js      # spacing, radius constants
    ├── typography.js   # text style presets
    ├── shadow.js       # shadow presets
    └── index.js        # re-exports all theme
```

---

## Key Decisions & Architecture

### Theme System
- `ThemeProvider` wraps the entire app in `App.js`
- All screens use `const { colors } = useTheme()` for **dynamic** colors
- Static `StyleSheet.create()` blocks still import `colors` from `../../theme` as a **static fallback** (the `darkColors` export)
- `lightColors` and `darkColors` are both defined in `colors.js`
- System preference is detected via `useColorScheme()`

### Navigation Flow
```
App.js
└── ThemeProvider
    └── AppStateProvider
        └── RootNavigator
            ├── AuthStack (SignupScreen, LoginScreen)
            ├── OnboardingStack (5 screens, but 3 steps for user)
            └── TabsNavigator (Profile, Circle, Swipe, Matches, Chat)
```

- `RootNavigator` listens to Firebase auth state + Firestore `profileComplete` flag
- When `profileComplete === true`, user is sent to Tabs automatically

### Onboarding Flow (V2 — 3 steps only)
1. `SignupBasicsScreen` — legal name, gender, interestedIn
2. `NameAgeScreen` → navigates directly to `PhotosPromptsScreen` (skips old IntentSliders/Bubbles)
3. `PhotosPromptsScreen` — up to 6 photos + 3 prompts (uploads to Firebase Storage)
4. `VibeOnboardingScreen` — vibe/interests selection
5. `OnboardingDoneScreen` — sets `profileComplete: true` in Firestore

**Profile Completion Gate** (`profileCompletion.js`): only requires `name`, `dobISO`, `gender`, `interestedIn` (old intent sliders and bubbles are NOT required).

### Photo Upload Pipeline
- `pickImageCompressed()` → picks from gallery, compresses to 1080px JPEG
- `uploadProfilePhoto(uid, localUri, index)` → uploads via `fetch → blob → uploadBytes`
- Saves as `{ uri: "https://firebasestorage.googleapis.com/...", type: "remote" }` in Firestore
- `SwipeScreen` reads `profile.photos[].uri` via `normalizePhotos()` helper

### Voice Reacts
- `VoiceRecorder` component uses `expo-av`
- Hold-to-record, releases to send
- In `SwipeScreen`, each `PromptCard` has a "Voice React" button
- `handleVoiceReact(uri, duration, promptQuestion)` is called on send — simulates a high-intent Like action

---

## Firestore Data Model

### `/users/{uid}`
```js
{
  name: "Stage Name",
  legalName: "Legal Name",
  dobISO: "YYYY-MM-DD",
  age: 25,
  gender: "woman" | "man" | "other",
  interestedIn: "women" | "men" | "everyone",
  photos: [{ uri: "https://...", type: "remote" }],  // Firebase Storage URLs
  prompts: [{ q: "question", a: "answer" }],
  vibe: ["tag1", "tag2"],
  location: { lat, lng },
  profileComplete: true,
}
```

### `/matches/{matchId}`
```js
{ participants: [uid1, uid2], createdAt: Timestamp }
```

### `/chats/{matchId}/messages/{msgId}`
```js
{ senderId, text, createdAt }
```

### `/app_config/public`
Config set by admin: `blur_likes_received`, `ok_with_bubbles`, `max_photos`, `max_prompts`, etc.

---

## Firebase Rules
- `firestore.rules` — in project root, **must be deployed manually** to Firebase Console → Firestore → Rules
- `storage.rules` — in project root, **must be deployed manually** to Firebase Console → Storage → Rules
- Auth: any logged-in user can read all profiles; users can only write their own doc

---

## Environment Variables (`.env`)
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

---

## Running the App

```bash
# Start dev server (with cache clear)
npx expo start -c

# Verify build has no errors
npx expo export --platform android
```

Scan the QR code with **Expo Go** on the phone. Both phone and laptop must be on the same Wi-Fi network.

---

## Pending / Next Features
- [ ] Deploy `firestore.rules` and `storage.rules` to Firebase Console
- [ ] Test end-to-end photo upload and visibility on swipe cards
- [ ] Gamified "Blind Date" mode (weekly live paired chat event)
- [ ] "Red Flag / Green Flag" profile tags
- [ ] Secret Admirers carousel (blurred likes)
- [ ] Real-time match notifications
