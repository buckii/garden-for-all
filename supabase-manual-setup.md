# Manual Supabase Setup Instructions

Since you prefer to manually set up the database, follow these steps:

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: "Garden For All"
4. Choose a database password (save this!)
5. Select region closest to Ohio (US East)

## 2. Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy your Project URL and anon/public key
3. Update your `.env` file:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Run Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy the entire contents of `database_schema.sql`
3. Paste into a new query and run it
4. This creates all tables, policies, and sample data

## 4. Configure Email with Mailgun

1. Go to Authentication > Settings in Supabase
2. Scroll to SMTP Settings
3. Configure with your Mailgun credentials:
   - Host: `smtp.mailgun.org`
   - Port: `587`
   - Username: Your Mailgun SMTP username
   - Password: Your Mailgun SMTP password
   - Sender email: Your verified domain email

## 5. Create Admin User

1. Go to Authentication > Users
2. Click "Add user"
3. Add email/password for admin access
4. In the raw user metadata, add:
   ```json
   {
     "role": "admin"
   }
   ```

## 6. Configure Row Level Security

The database schema already includes RLS policies, but verify:

1. Go to Database > Tables
2. Each table should show RLS as "Enabled"
3. Click on a table to see its policies

## 7. Test Connection

Run the app and test:
```bash
npm run dev
```

The app should load without database errors.

## Environment Variables Needed

Make sure your `.env` file has:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Pusher (optional for real-time features)
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_APP_CLUSTER=your_pusher_cluster

# Mailgun (for email notifications)
VITE_MAILGUN_DOMAIN=your_mailgun_domain
VITE_MAILGUN_API_KEY=your_mailgun_api_key
```