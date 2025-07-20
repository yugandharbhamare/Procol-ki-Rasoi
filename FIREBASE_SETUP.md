# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google Sign-In for the Procol ki Rasoi web app.

## Prerequisites

1. A Google account
2. Node.js and npm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "procol-ki-rasoi")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" in the list of providers
5. Click "Enable"
6. Add your project's public-facing name (e.g., "Procol ki Rasoi")
7. Add your support email
8. Click "Save"

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to the "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "procol-ki-rasoi-web")
6. Copy the Firebase configuration object

## Step 4: Update Firebase Configuration

1. Open `src/firebase/config.js` in your project
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Configure Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Scroll down to "Authorized domains"
3. Add your domain (for development, add `localhost`)

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. You should see a "Sign in with Google" button
4. Click it and complete the Google sign-in process
5. You should be redirected to the main app with your user information displayed

## Features Implemented

- ✅ Google Sign-In authentication
- ✅ User profile display with photo, name, and email
- ✅ Sign out functionality
- ✅ User information included in orders
- ✅ Customer details shown in receipts
- ✅ Protected routes (login required to access app)

## User Information Captured

The app captures the following information from Google:
- **Email**: User's Google email address
- **First Name**: First part of the display name
- **Last Name**: Remaining parts of the display name
- **Display Name**: Full name from Google
- **Profile Photo**: User's Google profile picture
- **User ID**: Unique Firebase user identifier

## Security Notes

- User data is only stored locally in the app state
- No user data is sent to external servers
- Firebase handles all authentication security
- User information is only used for order tracking and receipts

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/popup-closed-by-user)"**
   - User closed the popup before completing sign-in
   - This is normal behavior, just try again

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console
   - For development, make sure `localhost` is added

3. **"Firebase: Error (auth/popup-blocked)"**
   - Browser blocked the popup
   - Allow popups for your domain and try again

### Getting Help:

- Check Firebase Console for error logs
- Verify your configuration in `src/firebase/config.js`
- Ensure all domains are authorized in Firebase Console
- Check browser console for detailed error messages 

For testing the site on mobile, you'll need to add the following domains to Firebase's authorized domains list:

##  **Firebase Console Setup:**

### **✅ Go to Firebase Console:**
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your "procol-ki-rasoi" project
3. Go to **Authentication** → **Settings**
4. Scroll down to **"Authorized domains"**

### **✅ Add These Domains:**

#### **1. For Development (Local Network):**
```
localhost
192.168.1.3
```

#### **2. For Mobile Testing (Your Local IP):**
```
192.168.1.3:3000
```

#### **3. If Using Different Port:**
```
192.168.1.3:5173
```

##  **How to Find Your Local IP:**

### **✅ On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### **✅ On Windows:**
```cmd
ipconfig | findstr "IPv4"
```

### **✅ Quick Method:**
```bash
hostname -I
```

## 🚀 **Testing Steps:**

### **✅ 1. Start Your Dev Server:**
```bash
npm run dev
```

### **✅ 2. Note the Network URL:**
Look for something like:
```
Local:   http://localhost:3000/
Network: http://192.168.1.3:3000/
```

### **✅ 3. Add to Firebase:**
- Add `192.168.1.3` (without port)
- Add `localhost`

### **✅ 4. Test on Mobile:**
- Connect mobile to same WiFi network
- Open browser and go to `http://192.168.1.3:3000`
- Try Google Sign-In

## ⚠️ **Important Notes:**

### **✅ Domain Format:**
- **Don't include ports** in Firebase authorized domains
- Just add: `192.168.1.3` (not `192.168.1.3:3000`)
- Add `localhost` for desktop testing

### **✅ Network Requirements:**
- Mobile and computer must be on same WiFi network
- Firewall should allow connections on port 3000
- Some corporate networks may block this

### **✅ Alternative Testing:**
If local network doesn't work, you can:
1. **Use ngrok** to create a public tunnel
2. **Deploy to Vercel/Netlify** for testing
3. **Use Firebase Hosting** for development

## 🔍 **Troubleshooting:**

### **✅ If Sign-In Fails:**
1. Check browser console for errors
2. Verify domain is in authorized list
3. Ensure mobile and computer are on same network
4. Try refreshing the page

### **✅ Common Issues:**
- **"Unauthorized domain"**: Add the IP to Firebase
- **"Popup blocked"**: Allow popups for the domain
- **"Network error"**: Check WiFi connection

Would you like me to help you find your specific local IP address or set up any alternative testing methods? 