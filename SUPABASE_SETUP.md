# Supabase Setup Guide

## Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your Project URL and Anon Key

### 2. Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 4. Run Schema
1. Go to Supabase SQL Editor
2. Copy and run `supabase_schema.sql`

## Schema Features

### Tables
- **users**: id, name, emailid, created_at
- **orders**: id, user_id, status, order_amount, created_at, updated_at
- **order_items**: id, order_id, item_name, quantity, price, created_at

### Security
- Row Level Security (RLS) enabled
- Users can only see their own orders
- Staff can see all orders (authorized emails)

### Realtime
- Orders and order_items tables enabled for realtime
- Automatic notifications on status changes

## Usage

### Create Order
```javascript
import { createOrder } from './services/supabaseService'

const result = await createOrder({
  user_id: 'user-uuid',
  order_amount: 150.00,
  items: [
    { name: 'Butter Chicken', quantity: 2, price: 75.00 }
  ]
})
```

### Subscribe to Updates
```javascript
import { subscribeToOrders } from './services/supabaseService'

const subscription = subscribeToOrders((payload) => {
  console.log('Order updated:', payload)
})
```

### Update Status (Staff)
```javascript
import { updateOrderStatus, ORDER_STATUS } from './services/supabaseService'

await updateOrderStatus('order-uuid', ORDER_STATUS.ACCEPTED)
```

## Staff Emails
Default authorized staff emails:
- admin@procol.in
- staff@procol.in
- kitchen@procol.in
- manager@procol.in

Update these in the RLS policies as needed.
