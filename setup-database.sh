#!/bin/bash

# Garden For All Database Setup Script
# Run this after creating your Supabase project and adding environment variables

echo "🌱 Setting up Garden For All database..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and add your Supabase credentials."
    exit 1
fi

# Source environment variables
source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing Supabase environment variables. Please check your .env file."
    exit 1
fi

echo "📋 Environment variables loaded successfully"

# Check if npx supabase is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

echo "🚀 Installing Supabase CLI if not already installed..."
npm install -g supabase

echo "🔗 Linking to your Supabase project..."
echo "You'll need to enter your project reference ID and database password."
echo "Find these in your Supabase dashboard under Settings > General"
supabase link --project-ref YOUR_PROJECT_REF

echo "📊 Running database migrations..."
supabase db push --db-url "$DATABASE_URL"

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to Supabase Auth settings and configure email templates"
echo "2. Add Mailgun integration for email sending"
echo "3. Set up admin user in Supabase Auth dashboard"
echo "4. Test the application with 'npm run dev'"
echo ""
echo "🌿 Happy gardening!"