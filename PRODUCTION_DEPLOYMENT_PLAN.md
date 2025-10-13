# 🚀 Production Deployment Plan - Staff Portal Fix

## ✅ Pre-Deployment Checklist

- [x] **Staging Testing**: ✅ Confirmed working on staging
- [x] **Database Backup**: Take full backup before deployment
- [x] **Rollback Plan**: Ready for quick rollback if needed
- [x] **Monitoring**: Set up alerts for errors

## 📋 Deployment Steps

### **Step 1: Database Deployment (Low Risk)**

**Action**: Deploy the RPC function to production Supabase

**Commands**:
```sql
-- Run this in Supabase Production SQL Editor
CREATE OR REPLACE FUNCTION get_order_items_by_ids(order_ids UUID[])
RETURNS TABLE (
    id UUID,
    order_id UUID,
    item_name VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return order items where order_id is in the provided array
    RETURN QUERY
    SELECT 
        oi.id,
        oi.order_id,
        oi.item_name,
        oi.quantity,
        oi.price,
        oi.created_at
    FROM order_items oi
    WHERE oi.order_id = ANY(order_ids)
    ORDER BY oi.order_id, oi.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_order_items_by_ids(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_items_by_ids(UUID[]) TO anon;

-- Add a comment to document the function
COMMENT ON FUNCTION get_order_items_by_ids(UUID[]) IS 'Get order items for multiple order IDs without URL length limits. Accepts array of UUIDs and returns matching order items.';
```

**Verification**:
```sql
-- Test the function
SELECT * FROM get_order_items_by_ids(ARRAY['your-test-order-id']);
```

### **Step 2: Frontend Deployment (Medium Risk)**

**Action**: Deploy the updated frontend code

**Files Changed**:
- `src/services/supabaseService.js` (2 locations)
- `src/services/optimizedSupabaseService.js` (2 locations)

**Deployment Method**: 
- Deploy through your normal CI/CD pipeline
- Or manually deploy the updated files

### **Step 3: Verification**

**Tests to Run**:
1. ✅ Staff portal loads without errors
2. ✅ Orders display correctly
3. ✅ Order items load properly
4. ✅ No 400 Bad Request errors in browser console
5. ✅ All order status updates work

**Monitoring**:
- Watch browser console for errors
- Monitor Supabase logs for failed requests
- Check staff portal functionality

## 🛡️ Rollback Plan

### **If Issues Occur**:

**Quick Rollback (Database)**:
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS get_order_items_by_ids(UUID[]);
```

**Quick Rollback (Frontend)**:
- Revert to previous commit
- Or manually restore the old `.in('order_id', orderIds)` queries

### **Rollback Commands**:
```bash
# If using git
git revert <commit-hash>

# Or restore specific files
git checkout HEAD~1 -- src/services/supabaseService.js
git checkout HEAD~1 -- src/services/optimizedSupabaseService.js
```

## 📊 Expected Results

### **Before Fix**:
- ❌ 400 Bad Request errors
- ❌ Staff portal fails to load orders
- ❌ Long URL query parameters

### **After Fix**:
- ✅ Staff portal loads successfully
- ✅ All orders display correctly
- ✅ No URL length limit issues
- ✅ Better performance with bulk queries

## 🚨 Emergency Contacts

- **Primary**: [Your Name]
- **Backup**: [Backup Person]
- **Database Admin**: [DB Admin]

## 📝 Post-Deployment Tasks

- [ ] Monitor for 24 hours
- [ ] Document deployment success
- [ ] Update team on fix
- [ ] Clean up staging environment

---

**Deployment Status**: Ready to Deploy ✅
**Risk Level**: Low-Medium
**Estimated Downtime**: 0-2 minutes
**Rollback Time**: < 5 minutes
