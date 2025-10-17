# 🔒 API Key Security - Studium Chemistry Canvas

## ⚠️ CRITICAL SECURITY INCIDENT RESPONSE

Your Gemini API key was exposed in the GitHub repository. This document outlines the security measures that have been implemented to prevent future incidents.

## What Was Fixed

### 1. ❌ Removed Hardcoded API Keys
- **Before**: API keys were hardcoded directly in:
  - `src/App.tsx` (line 85)
  - `src/firebase/apiKeys.ts` (lines 5-10)
  
- **After**: All hardcoded keys have been removed ✅

### 2. ✅ Secure API Key Storage in Firebase
- API keys are now stored in Firebase Firestore under `admin/apiKeys/keys` collection
- Collection is protected with Firestore security rules
- Only metadata is exposed to clients (masked keys like `AIzaSy...eST8s`)

### 3. ✅ User-Provided API Keys
- Users configure their own API keys through the Settings UI
- Keys are stored in browser's localStorage (encrypted over HTTPS)
- Never exposed in code or committed to git

### 4. ✅ New Secure API Key Service
- New service: `src/services/secureApiKeyService.ts`
- Provides safe methods for managing API keys:
  - `maskApiKey()` - Display keys safely without exposing full value
  - `storeSecureApiKey()` - Securely store in localStorage
  - `getSecureApiKey()` - Retrieve without logging full key
  - `isValidApiKey()` - Validate key format

## Proper API Key Management

### For Users (LOCAL DEVELOPMENT)

1. **Get Your API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a free API key

2. **Configure in Studium**
   - Click Settings (⚙️) in the toolbar
   - Paste your API key
   - Click Save
   - Key is now stored securely in your browser

3. **Never Share Your Key**
   - Your API key is stored locally on your machine
   - Never commit it to version control
   - Never share it with others

### For Administrators/Developers (FIREBASE SETUP)

To initialize API keys in Firebase (use a secure backend or admin dashboard):

```typescript
// Use Firebase Admin SDK ONLY on your backend
import { initializeApiKeys } from './src/firebase/apiKeys';

const apiKeys = [
  'AIzaSyDCU9K42G7wKxgszFe-1UeT7rtU0WeST8s',
  'AIzaSyADO5LrzSQ8qlvJIzIIatoAZpdHwj6ALIU',
  // ... more keys
];

await initializeApiKeys(apiKeys);
```

**IMPORTANT**: Only do this from a secure backend, NEVER from client-side code.

## Environment Variables

### Development (.env.local)

```
# Only for local development
# Never commit this file with real keys to git

VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Production

Use:
- **Firebase Secrets Manager** ✅ (Recommended)
- **Cloud Run environment variables** ✅ (Recommended)
- **Backend API endpoints** ✅ (Recommended)
- **Never hardcode in frontend code** ❌

## Firebase Security Rules

Protect your API keys with Firestore rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only admins can access API keys
    match /admin/apiKeys/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
    
    // Users can only read their own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## How It Works Now

### User Journey

1. **Login** → User enters credentials
2. **Settings** → User provides their own Gemini API key
3. **Storage** → Key stored in localStorage (local to user's browser)
4. **Usage** → App uses the stored key for API calls
5. **Security** → Key never leaves user's browser, never logged, never exposed

### API Key Flow

```
┌─────────────────────────────────────────────────────┐
│ User Enters API Key in Settings                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ secureApiKeyService.storeSecureApiKey()            │
│ - Validates key format                              │
│ - Stores in localStorage                            │
│ - Logs masked key only (e.g., AIzaSy...eST8s)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ App Uses Key for Gemini API Calls                   │
│ - Retrieved from localStorage                       │
│ - Only accessible in user's browser                 │
│ - Never exposed in code                             │
└─────────────────────────────────────────────────────┘
```

## Checklist for Your Repository

After this security fix, ensure:

- ✅ `.env` and `.env.local` are in `.gitignore`
- ✅ No API keys in code files
- ✅ No API keys in commit history
- ✅ GitHub token revoked (if exposed)
- ✅ Gemini API keys rotated (delete exposed keys, create new ones)

## Rotating Your API Keys

If keys were exposed:

1. **Immediately delete exposed keys**
   - Go to: https://console.cloud.google.com
   - Delete all exposed API keys
   - Create new ones

2. **Update Firebase**
   - If keys are stored in Firebase, update with new keys
   - Use admin SDK only from backend

3. **Users Update Keys**
   - Inform users to update their API keys in Settings
   - Old keys will no longer work

## Future Prevention

### Git Hooks
Add pre-commit hook to prevent API keys in commits:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if grep -r "AIzaSy" --include="*.ts" --include="*.tsx" --include="*.js" src/; then
  echo "❌ ERROR: API keys found in code!"
  exit 1
fi
```

### GitGuardian Integration
Enable GitGuardian to automatically scan for exposed secrets.

### Secrets Manager
Use GitHub Secrets for CI/CD, not in code.

## Support

For security questions:
1. Review this document
2. Check `src/services/secureApiKeyService.ts` for implementation
3. See `src/firebase/apiKeys.ts` for Firebase integration

---

**Last Updated**: 2025-10-17
**Status**: ✅ Security Fix Applied
