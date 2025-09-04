# 🚀 **SUPABASE SETUP GUIDE - FIX YOUR ORDER PLACEMENT ISSUES**

## ❌ **CURRENT PROBLEM**
Your Supabase tables (users, orders, order_items) are empty because the environment variables are missing. This is why:
- Orders are not being placed in the database
- Staff dashboard shows no orders
- Order history is not updated

## ✅ **SOLUTION: Create .env file**

### **Step 1: Create .env file in your project root**
```bash
# In your terminal, navigate to your project root and create .env file:
touch .env
```

### **Step 2: Get your Supabase credentials**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project dashboard
4. Go to **Settings** → **API**
5. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 3: Add credentials to .env file**
```bash
# Open .env file in your editor and add:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace the placeholder values with your actual credentials!**

### **Step 4: Restart your development server**
```bash
# Stop the current server (Ctrl+C) and restart:
npm run dev
```

## 🔍 **VERIFY THE SETUP**

### **Check 1: Environment Variables**
After restarting, you should see in the browser:
- ✅ **Green "Supabase Connection Successful" message**
- ✅ **No more red error messages**

### **Check 2: Console Logs**
In browser console, you should see:
```
🔧 SupabaseDebug: Environment variables are set
🔧 SupabaseDebug: Supabase client initialized successfully
🔧 SupabaseDebug: Database connection successful
🔧 SupabaseDebug: Table access successful, found 37 menu items
🔧 SupabaseDebug: User table access successful
🔧 SupabaseDebug: All tests passed!
```

### **Check 3: Database Tables**
Your Supabase dashboard should show:
- **menu_items**: 37 items (already populated)
- **users**: Will be populated when users sign in
- **orders**: Will be populated when orders are placed
- **order_items**: Will be populated when orders are placed

## 🧪 **TEST ORDER PLACEMENT**

1. **Add items to cart** - should work normally
2. **Place order** - should now save to Supabase
3. **Check Supabase dashboard** - should see new orders
4. **Staff dashboard** - should now show orders

## 🆘 **TROUBLESHOOTING**

### **If you still see red error messages:**

#### **Problem: "Missing Supabase environment variables"**
**Solution:** Double-check your `.env` file:
- File is in the project root (same folder as `package.json`)
- No spaces around the `=` sign
- Values are not wrapped in quotes
- File is saved and server restarted

#### **Problem: "Database connection failed"**
**Solution:** Check your Supabase credentials:
- URL is correct and includes `https://`
- Anon key is the full key (starts with `eyJ...`)
- Project is active and not paused

#### **Problem: "Table access failed"**
**Solution:** Run the database schema:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase_schema.sql`
3. Click "Run" to create all tables and data

## 📁 **FILE STRUCTURE**
```
your-project/
├── .env                    ← CREATE THIS FILE
├── package.json
├── src/
├── supabase_schema.sql    ← This has your database structure
└── SUPABASE_SETUP_GUIDE.md ← This file
```

## 🎯 **EXPECTED RESULT**
After following this guide:
- ✅ Orders will be placed in Supabase
- ✅ Staff dashboard will show orders
- ✅ Order history will be updated
- ✅ All functionality will work properly

## 🚨 **IMPORTANT NOTES**
- **Never commit .env file to git** (it's already in .gitignore)
- **Restart server after changing .env**
- **Check browser console for detailed error messages**
- **Use the SupabaseDebug component to verify connection**

---

**Need help? Check the browser console and SupabaseDebug component for specific error messages!**
