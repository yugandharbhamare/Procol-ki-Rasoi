# Database Scripts Guide

## 🎯 **Essential SQL Scripts (Keep These)**

### **1. `supabase_schema.sql`**
- **Purpose**: Main database structure and setup
- **When to use**: Initial database setup or complete reset
- **Contains**: All tables, indexes, constraints, and sample data

### **2. `emergency_fix_foreign_key.sql`**
- **Purpose**: Fix foreign key constraint violations immediately
- **When to use**: When you get "orders_user_id_fkey" constraint errors
- **Contains**: Quick fix to create missing users and resolve constraints

### **3. `quick_schema_fix.sql`**
- **Purpose**: Add missing connections and improve database structure
- **When to use**: After emergency fix, to add proper foreign keys and indexes
- **Contains**: Foreign key constraints, indexes, and data validation

## 🔧 **Migration Scripts (Use as Needed)**

### **4. `migration_recreate_users_table.sql`**
- **Purpose**: Recreate users table if it's corrupted or missing
- **When to use**: Only if users table has serious issues
- **Warning**: This will delete existing users data

### **5. `migration_add_photo_url.sql`**
- **Purpose**: Add photo_url column to users table
- **When to use**: If you need user profile photos
- **Safe**: Only adds column, doesn't delete data

## 📋 **Usage Order**

### **Step 1: Emergency Fix (If you have constraint errors)**
```sql
-- Copy and paste emergency_fix_foreign_key.sql into Supabase SQL editor
```

### **Step 2: Schema Improvements (After emergency fix)**
```sql
-- Copy and paste quick_schema_fix.sql into Supabase SQL editor
```

### **Step 3: Initial Setup (If starting fresh)**
```sql
-- Copy and paste supabase_schema.sql into Supabase SQL editor
```

## ⚠️ **Important Notes**

1. **Always backup** your database before running scripts
2. **Run emergency fix first** if you have constraint errors
3. **Test your application** after each script
4. **Use Supabase SQL editor** to run these scripts
5. **Don't run multiple scripts at once** - do them step by step

## 🗑️ **Removed Scripts**

The following scripts were removed to reduce clutter:
- `fix_database_schema.sql` - Use `quick_schema_fix.sql` instead
- `fix_foreign_key_constraints.sql` - Use `emergency_fix_foreign_key.sql` instead
- `cleanup_database.sql` - Use SQL scripts instead of Node.js
- `cleanup_database_step_by_step.sql` - Use `quick_schema_fix.sql` instead
- `migration_step_by_step.sql` - Use individual migration scripts
- `migration_update_order_status.sql` - Not needed for current setup
- `test_database_connection.sql` - Use Supabase dashboard instead

## 🚀 **Quick Start**

If you're getting foreign key constraint errors:

1. **Run `emergency_fix_foreign_key.sql`** in Supabase SQL editor
2. **Test your application** - orders should work now
3. **Run `quick_schema_fix.sql`** to improve database structure
4. **Test again** - everything should be properly connected

This keeps your project clean with only the essential scripts you actually need! 🎉
