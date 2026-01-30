#!/bin/bash

# Quick Admin Setup Script for AltEs E-commerce Platform
# This script helps you set up the admin account quickly

echo "🚀 AltEs Admin Setup Script"
echo "================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if supabase is running
if ! supabase status &> /dev/null; then
    echo "⚠️  Supabase is not running locally."
    echo "Starting Supabase..."
    supabase start
fi

echo "✅ Supabase is running"
echo ""

# Run the migration
echo "📦 Running user roles migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "================================"
echo "📋 Next Steps:"
echo "================================"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/mqpicboeltjzhfnvtkeh"
echo ""
echo "2. Go to Authentication > Users > Add User"
echo ""
echo "3. Create admin account:"
echo "   Email: admin@altes.com"
echo "   Password: (set a strong password)"
echo "   Auto Confirm User: ✅ Check this"
echo ""
echo "4. Go to SQL Editor and run:"
echo "   UPDATE public.profiles"
echo "   SET user_role = 'admin'"
echo "   WHERE email = 'admin@altes.com';"
echo ""
echo "5. Login at http://localhost:8080/"
echo ""
echo "================================"
echo "📖 For detailed instructions, see:"
echo "   docs/ADMIN_SETUP_GUIDE.md"
echo "================================"
echo ""
echo "✨ Setup script completed!"
