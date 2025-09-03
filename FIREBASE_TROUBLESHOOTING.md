# 🔥 Firebase Google Sign-in Troubleshooting Guide

## 🚨 **Common Google Sign-in Issues & Solutions**

### **1. Firebase Console Configuration**

#### **A. Enable Google Sign-in Provider:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **procol-ki-rasoi**
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. **Enable** Google sign-in
6. Add your **Project support email**
7. **Save**

#### **B. Add Authorized Domains:**
1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your Netlify domain: `procol-ki-rasoi.netlify.app`
3. Add `localhost` for local development
4. Add any other domains you're using

#### **C. Check OAuth Consent Screen:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Add your domain: `procol-ki-rasoi.netlify.app`
5. Add test users if needed
6. Make sure **Google+ API** is enabled

### **2. Environment Variables Check**

Verify these environment variables are set in your Netlify dashboard:

```bash
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### **3. Common Error Codes & Solutions**

#### **`auth/popup-closed-by-user`**
- **Cause**: User closed the sign-in popup
- **Solution**: Inform user to complete the sign-in process

#### **`auth/popup-blocked`**
- **Cause**: Browser blocked the popup
- **Solution**: Ask user to allow pop-ups for your domain

#### **`auth/unauthorized-domain`**
- **Cause**: Domain not in Firebase authorized domains
- **Solution**: Add domain to Firebase Console

#### **`auth/operation-not-allowed`**
- **Cause**: Google sign-in not enabled in Firebase
- **Solution**: Enable Google provider in Firebase Console

#### **`auth/network-request-failed`**
- **Cause**: Network connectivity issues
- **Solution**: Check internet connection

### **4. Testing Steps**

#### **Step 1: Check Console Logs**
Open browser console and look for:
- ✅ Firebase configuration complete
- 🚀 Starting Google sign-in process
- 📱 Calling signInWithPopup
- ✅ Google sign-in successful

#### **Step 2: Test Local Environment**
1. Run `npm run dev`
2. Try Google sign-in
3. Check console for errors

#### **Step 3: Test Production Environment**
1. Deploy to Netlify
2. Try Google sign-in
3. Check console for errors

### **5. Debugging Commands**

#### **Check Firebase Config:**
```javascript
// In browser console
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

#### **Check Auth State:**
```javascript
// In browser console
import { auth } from './src/firebase/config';
console.log('Auth State:', auth);
```

### **6. Alternative Sign-in Methods**

If Google sign-in continues to fail, consider:

#### **A. Email/Password Authentication:**
1. Enable in Firebase Console
2. Implement email/password forms
3. Use Firebase's built-in auth

#### **B. Phone Authentication:**
1. Enable in Firebase Console
2. Implement phone number input
3. Use SMS verification

### **7. Production Checklist**

Before deploying to production:

- ✅ Google sign-in enabled in Firebase
- ✅ Authorized domains configured
- ✅ OAuth consent screen configured
- ✅ Environment variables set in Netlify
- ✅ Tested locally
- ✅ Tested in staging environment

### **8. Support Resources**

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-in Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🎯 **Quick Fix Checklist**

1. **Firebase Console**: Enable Google sign-in provider
2. **Authorized Domains**: Add `procol-ki-rasoi.netlify.app`
3. **OAuth Consent**: Configure in Google Cloud Console
4. **Environment Variables**: Set in Netlify dashboard
5. **Test**: Try sign-in locally and in production
6. **Debug**: Check browser console for errors

---

**Need more help? Check the browser console for specific error messages!** 🔍
