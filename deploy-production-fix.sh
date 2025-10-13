#!/bin/bash

# 🚀 Production Deployment Script - Staff Portal Fix
# This script helps deploy the staff portal 400 error fix to production

set -e  # Exit on any error

echo "🚀 Starting Production Deployment - Staff Portal Fix"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Database Backup Check
print_status "Step 1: Checking database backup..."
echo "⚠️  IMPORTANT: Ensure you have a recent database backup before proceeding!"
read -p "Do you have a recent backup? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please create a database backup first!"
    exit 1
fi
print_success "Database backup confirmed"

# Step 2: Deploy Database Function
print_status "Step 2: Deploying RPC function to production database..."
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Supabase Production Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the SQL from: fix_bulk_order_items_query.sql"
echo "4. Run the SQL"
echo "5. Test with: SELECT * FROM get_order_items_by_ids(ARRAY['your-test-order-id']);"
echo ""
read -p "Press Enter when database function is deployed and tested..."

# Step 3: Deploy Frontend Changes
print_status "Step 3: Deploying frontend changes..."
echo ""
echo "📋 Files to deploy:"
echo "- src/services/supabaseService.js"
echo "- src/services/optimizedSupabaseService.js"
echo ""

# Check if files exist
if [ -f "src/services/supabaseService.js" ] && [ -f "src/services/optimizedSupabaseService.js" ]; then
    print_success "Frontend files are ready for deployment"
    echo "Deploy these files to your production environment"
else
    print_error "Frontend files not found!"
    exit 1
fi

read -p "Press Enter when frontend changes are deployed..."

# Step 4: Verification
print_status "Step 4: Verifying deployment..."
echo ""
echo "🧪 Tests to run:"
echo "1. Go to staff portal: https://your-domain.com/staff"
echo "2. Sign in with staff credentials"
echo "3. Check that orders load without errors"
echo "4. Verify no 400 Bad Request errors in browser console"
echo "5. Test order status updates"
echo ""
read -p "Press Enter when verification is complete..."

# Final status
print_success "🎉 Deployment Complete!"
echo ""
echo "📊 Expected Results:"
echo "✅ Staff portal loads without 400 errors"
echo "✅ All orders display correctly"
echo "✅ Order items load properly"
echo "✅ No URL length limit issues"
echo ""
echo "📝 Post-Deployment:"
echo "- Monitor for 24 hours"
echo "- Watch browser console for errors"
echo "- Check Supabase logs"
echo ""
echo "🛡️ Rollback Plan:"
echo "If issues occur, run:"
echo "DROP FUNCTION IF EXISTS get_order_items_by_ids(UUID[]);"
echo "And revert frontend files"
echo ""
print_success "Deployment script completed successfully!"
