# Firebase Auth Internal Error Fix Guide

## 🔍 Error Analysis
**Error**: `FirebaseError: Firebase: Error (auth/internal-error)`
**Cause**: Firebase configuration or Google OAuth setup issue

## 🔧 Step-by-Step Fix

### 1. Check Firebase Console Configuration

#### A. Verify Project Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Check **Project ID** matches your `.env.local`

#### B. Verify Web App Configuration
1. In Project Settings, go to **General** tab
2. Scroll to **Your apps** section
3. Find your web app
4. Check if the config matches your `.env.local`

### 2. Check Google OAuth Setup

#### A. Enable Google Sign-in
1. Go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Make sure it's **Enabled**
4. Check **Project support email** is set

#### B. Add Authorized Domains
1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - `yourdomain.com` (for production)
   - `netlify.app` (if using Netlify)

### 3. Check Environment Variables

#### A. Verify .env.local File
```bash
# Check these values match Firebase Console
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### B. Common Issues
- **API Key Mismatch**: Copy from Firebase Console exactly
- **Auth Domain**: Should be `project-id.firebaseapp.com`
- **Project ID**: Must match exactly

### 4. Check Google Cloud Console

#### A. Enable Google+ API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Library**
4. Search for **Google+ API**
5. Make sure it's **Enabled**

#### B. Check OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure it's configured
3. Add your domain to **Authorized domains**

### 5. Test Configuration

#### A. Simple Test
```javascript
// Add this to your AuthContext temporarily
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

#### B. Check Browser Console
- Look for Firebase initialization errors
- Check for missing environment variables
- Verify API key format

### 6. Common Solutions

#### A. Clear Browser Cache
- Clear cookies and cache
- Try incognito/private mode
- Check if ad-blockers are interfering

#### B. Check Network
- Ensure no firewall blocking Google/Firebase
- Check if corporate network has restrictions
- Try different network (mobile hotspot)

#### C. Firebase Version
- Check if using latest Firebase version
- Update if necessary: `npm update firebase`

## 🚨 Emergency Fixes

### If Still Not Working:

#### 1. Recreate Firebase Web App
1. Delete existing web app in Firebase Console
2. Create new web app
3. Copy new config to `.env.local`
4. Restart application

#### 2. Check Firebase Status
- Visit [Firebase Status Page](https://status.firebase.google.com/)
- Check if there are any ongoing issues

#### 3. Contact Firebase Support
- If all else fails, contact Firebase support
- Provide error logs and configuration details

## ✅ Verification Steps

After fixing:
1. **Restart your application**
2. **Clear browser cache**
3. **Try Google sign-in**
4. **Check browser console for errors**
5. **Verify user creation in Supabase**

## 🔍 Debug Commands

Add this to your AuthContext for debugging:
```javascript
useEffect(() => {
  console.log('🔍 Firebase Config Check:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  });
}, []);
```

The `auth/internal-error` usually means a configuration mismatch. Follow these steps systematically!
