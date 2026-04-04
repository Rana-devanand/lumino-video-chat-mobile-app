# EAS Build & Setup Guide for Lumina

This guide details the steps to generate, test, and release the Lumina app using Expo Application Services (EAS).

---

## 🚀 1. Core Build Commands

Since EAS is not installed globally on your system, please always use the `npx eas-cli` prefix.

### Generate a Preview APK (Highly Recommended)
An APK file that can be installed directly on any Android device for testing.
```bash
npx eas-cli build --platform android --profile preview
```

### Generate a Production AAB
The file format required for uploading to the Google Play Store.
```bash
npx eas-cli build --platform android --profile production
```

---

## 🔑 2. Credentials & Keystore

When you run your first build, EAS will ask you the following questions:

1.  **Which account would you like to use?** Choose `dev.cloudapp93`.
2.  **Generate a new Keystore?** If you do not have an existing `.jks` file, choose **"Yes"**. EAS will securely store this in the cloud for you.
3.  **App ID**: This should match `com.expirelymobile.lumino` as defined in your `app.json`.

---

## ⚠️ 3. CRITICAL: Firebase Phone Auth Fix

**Firebase Phone Authentication will FAIL in your release build unless you follow these steps:**

1.  **Get your SHA-1 Fingerprint**: Once your EAS build starts, run:
    ```bash
    npx eas-cli credentials
    ```
    Select `Android` -> `production` or `preview` -> `Keystore: SHA1 Fingerprint`.
2.  **Add to Firebase Console**:
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Select your project -> **Project Settings** -> **General**.
    - Scroll down to **Your apps** -> **Android app**.
    - Click **"Add fingerprint"** and paste the SHA-1 from EAS.
3.  **Update Config (Optional but recommended)**: Download the updated `google-services.json` and replace the one in your project if any keys changed.

---

## 📲 4. Installing the Build

1.  **Wait for the Build**: The terminal will provide a URL (e.g., `expo.dev/accounts/.../builds/...`).
2.  **Download**: Once the build status is "Finished", open that link on your phone.
3.  **Install**: Download the `.apk` (for preview) and install it. You may need to "Allow from this source" in your Android settings.

---

## 📤 5. Submission to Play Store

Once you have a `production` build finished:
```bash
npx eas-cli submit --platform android
```
This will guide you through uploading the AAB file to the Google Play Console.

---

## 🛠️ Troubleshooting

- **"Command not found"**: Always use `npx eas-cli` instead of `eas`.
- **Build Fails**: Check the build logs at the URL provided in your terminal. Common issues include missing environment variables or outdated `expo` versions.
- **OTP not received**: Make sure your **SHA-1 and SHA-256** fingerprints from EAS are added to your Firebase project settings.


## port running
npx http-server ./web-redirect -p 3000
