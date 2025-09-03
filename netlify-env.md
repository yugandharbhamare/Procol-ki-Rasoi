# Netlify Environment Variables Setup

To deploy your app successfully on Netlify, you need to configure the following environment variables in your Netlify dashboard:

## Required Environment Variables

Go to your Netlify dashboard → Site settings → Environment variables and add:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Supabase Configuration (if using)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Set Environment Variables in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to "Site settings" → "Environment variables"
4. Click "Add a variable"
5. Add each variable with its corresponding value
6. Save and redeploy

## Important Notes:

- All environment variables must start with `VITE_` to be accessible in your React app
- Never commit actual API keys to your repository
- Use the same values as your local `.env` file
- After adding environment variables, trigger a new deployment

## Deployment Steps:

1. Push these configuration files to your repository
2. Configure environment variables in Netlify
3. Trigger a new deployment
4. Check the build logs for any errors
