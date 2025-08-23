# 🌱 Garden For All - Community Garden Management System

A comprehensive web application for tracking produce production and distribution to local food pantries in New Albany, Ohio.

## Features

### 🎯 **Three User Interfaces**
- **Admin Panel** (`/admin`) - Manage produce types, categories, and food pantries
- **Harvest Interface** (`/harvest`) - Touch-optimized data entry for volunteers
- **Dashboard** (`/dashboard`) - Real-time production statistics and commitment tracking

### 📊 **Core Functionality**
- **Produce Tracking** - Record harvest quantities with automatic value calculations
- **Pantry Management** - Track commitments and delivery progress for local food pantries
- **Real-time Updates** - Live dashboard updates using Pusher
- **Excel Export** - Generate detailed reports for analysis and record-keeping
- **Touch Optimization** - Large buttons and inputs designed for outdoor tablet use

### 🔐 **Security & Authentication**
- Admin authentication with Supabase Auth
- Row Level Security (RLS) policies
- Server-side API calls only
- No client-side data storage

## Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Real-time**: Pusher for live updates
- **State Management**: Pinia
- **Export**: XLSX for Excel file generation
- **Email**: Mailgun integration for password resets

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account
- Pusher account (optional, for real-time features)
- Mailgun account (optional, for emails)

### 2. Project Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see below)
```

### 3. Environment Configuration

Update your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Pusher Configuration (Optional)
VITE_PUSHER_APP_KEY=your_pusher_app_key_here
VITE_PUSHER_APP_CLUSTER=your_pusher_cluster_here

# Mailgun Configuration (Optional)
VITE_MAILGUN_DOMAIN=your_mailgun_domain
VITE_MAILGUN_API_KEY=your_mailgun_api_key
```

### 4. Database Setup

#### Option A: Manual Setup (Recommended)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and run the entire contents of `database_schema.sql`
4. Follow the detailed setup guide in `supabase-manual-setup.md`

#### Option B: Automated Setup
```bash
# Make setup script executable and run
chmod +x setup-database.sh
./setup-database.sh
```

### 5. Admin User Setup

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with your email/password
3. In the user's raw metadata, add:
   ```json
   {
     "role": "admin"
   }
   ```

### 6. Run the Application

```bash
# Development server
npm run dev

# Production build
npm run build
npm run preview
```

## Application Structure

```
src/
├── components/
│   ├── admin/          # Admin interface components
│   ├── dashboard/      # Dashboard visualizations
│   ├── harvest/        # Touch-optimized harvest entry
│   └── shared/         # Shared components
├── composables/        # Vue composables
├── lib/               # Configuration (Supabase, Pusher)
├── stores/            # Pinia state management
├── utils/             # Utility functions (Excel export, etc.)
└── views/             # Main application pages
```

## Usage Guide

### For Administrators

1. **Login**: Visit `/login` with your admin credentials
2. **Manage Categories**: Add vegetable, fruit, herb, and flower categories
3. **Configure Produce**: Set up produce types with pricing information
4. **Setup Pantries**: Add food pantry contacts and annual commitments
5. **Export Data**: Generate Excel reports from the admin panel

### For Volunteers (Harvest Entry)

1. **Visit `/harvest`** - No login required
2. **Select Produce**: Choose from visual grid of available produce types
3. **Enter Quantity**: Use large numeric keypad or quick amount buttons
4. **Add Details**: Optional harvester name and notes
5. **Save Entry**: Data is immediately saved and visible on dashboard

### For Monitoring (Dashboard)

1. **Visit `/dashboard`** - No login required
2. **View Statistics**: See daily, weekly, monthly, and yearly totals
3. **Track Progress**: Monitor food pantry commitment fulfillment
4. **Recent Activity**: See live feed of harvest entries
5. **Fullscreen Mode**: Toggle for large screen TV display

## Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Schema

The system uses 5 main tables:

- **`produce_categories`** - Vegetable, fruit, herb, flower categories
- **`produce_types`** - Specific items like "Tomatoes" with pricing
- **`food_pantries`** - Local pantries with contact info and commitments  
- **`harvest_entries`** - Individual harvest records with quantities
- **`pantry_distributions`** - Tracking deliveries to pantries

See `database_schema.sql` for the complete schema with sample data.

## Deployment

### Production Build
```bash
npm run build
```

### Recommended Hosting
- **Netlify** - Easy deployment with environment variables
- **Vercel** - Great Vue.js support with automatic deployments
- **Supabase Hosting** - Integrated with your database

### Large Screen Display Setup
For TV dashboard displays:
1. Deploy to a public URL
2. Set browser to fullscreen mode on `/dashboard`
3. Configure auto-refresh (already built-in every 30 seconds)
4. Use Chrome kiosk mode for dedicated displays

## Troubleshooting

### Common Issues

**Authentication Not Working**
- Check Supabase URL and keys in `.env`
- Verify admin user has correct role in metadata

**Database Connection Failed**
- Confirm Supabase project is active
- Check RLS policies are properly set

**Real-time Updates Not Working**
- Pusher credentials may be missing or invalid
- Real-time features are optional - app works without them

**Excel Export Fails**
- Check browser console for errors
- Verify harvest data exists in database

For detailed troubleshooting, see the complete documentation in the project files.

---

## 🌿 Happy Gardening!

Built with ❤️ for the New Albany community
