# Garden For All - Netlify Functions Setup Guide

## Overview

This implementation uses **Netlify Functions** for authentication with MongoDB, providing a serverless authentication system that's completely independent from Supabase.

## Features

✅ **Serverless Authentication** - JWT-based auth with Netlify Functions  
✅ **MongoDB Integration** - Optimized for serverless connections  
✅ **Supabase-Compatible API** - Drop-in replacement for existing frontend code  
✅ **Role-Based Access** - Admin/user roles preserved  
✅ **Secure Password Hashing** - bcrypt with salt rounds  
✅ **CORS Support** - Proper cross-origin handling  

## Prerequisites

1. **MongoDB Database** - Either MongoDB Atlas (recommended) or local MongoDB
2. **Netlify Account** - For hosting and functions
3. **Node.js 20+** - For local development

## Setup Instructions

### 1. MongoDB Setup (Atlas - Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier works)
3. Create database user with read/write permissions
4. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/garden-for-all`)
5. Whitelist Netlify IPs or use `0.0.0.0/0` for development

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Netlify Functions dependencies
cd netlify/functions
npm install
cd ../..
```

### 3. Environment Variables

Create `.env` in project root:

```bash
# Frontend - API endpoint
VITE_API_URL=/.netlify/functions

# Pusher (if using real-time features)
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_APP_CLUSTER=your_pusher_cluster
```

### 4. Netlify Deployment

#### Option A: Git-Based Deployment (Recommended)

1. Push code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Set environment variables in Netlify dashboard:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/garden-for-all
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@gardenforall.org
ADMIN_PASSWORD=your-secure-admin-password
NODE_ENV=production
```

#### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --build
netlify deploy --prod
```

### 5. Initialize Admin User

After deployment, create the admin user:

```bash
# Using curl (replace YOUR_SITE_URL)
curl -X POST https://YOUR_SITE_URL/.netlify/functions/init-admin

# Or visit in browser:
https://YOUR_SITE_URL/.netlify/functions/init-admin
```

### 6. Local Development

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Start local development with functions
netlify dev

# This will start:
# - Frontend at http://localhost:8888
# - Functions at http://localhost:8888/.netlify/functions/
```

## API Endpoints

All functions are available at `/.netlify/functions/`:

### Authentication
- `POST /.netlify/functions/auth-signin` - Sign in
- `POST /.netlify/functions/auth-signup` - Sign up  
- `POST /.netlify/functions/auth-signout` - Sign out
- `GET /.netlify/functions/auth-session` - Get current session
- `GET /.netlify/functions/auth-me` - Get current user
- `POST /.netlify/functions/auth-reset-password` - Reset password

### Admin
- `POST /.netlify/functions/init-admin` - Initialize admin user

## Frontend Integration

The frontend uses a drop-in replacement for Supabase auth:

```typescript
// src/lib/netlify-auth.ts provides:
import { supabase } from '@/lib/netlify-auth'

// Same API as Supabase:
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signOut()
await supabase.auth.getSession()
```

## Default Admin Account

- **Email**: `admin@gardenforall.org` (or your ADMIN_EMAIL)
- **Password**: Set via ADMIN_PASSWORD environment variable

**Security**: Change the admin password after first login!

## File Structure

```
netlify/
├── functions/
│   ├── utils/
│   │   ├── db.js           # MongoDB connection
│   │   ├── User.js         # User model
│   │   └── auth.js         # Auth utilities
│   ├── auth-signin.js      # Sign in function
│   ├── auth-signup.js      # Sign up function
│   ├── auth-session.js     # Session validation
│   ├── auth-signout.js     # Sign out function
│   ├── auth-me.js          # Get user function
│   ├── auth-reset-password.js # Password reset
│   ├── init-admin.js       # Admin initialization
│   └── package.json        # Function dependencies
├── netlify.toml            # Netlify configuration
src/
├── lib/
│   └── netlify-auth.ts     # Frontend auth client
└── composables/
    └── useAuth.ts          # Updated for Netlify auth
```

## Security Features

- ✅ **JWT Tokens** - Secure, stateless authentication
- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **CORS Protection** - Proper origin handling
- ✅ **Input Validation** - Joi schema validation
- ✅ **Error Handling** - No sensitive data leakage
- ✅ **Connection Pooling** - Optimized for serverless

## Advantages of Netlify Functions

1. **Serverless Scaling** - Automatic scaling with usage
2. **Zero Server Management** - No infrastructure to maintain  
3. **Git-Based Deployment** - Deploy on every push
4. **Edge Computing** - Functions run close to users
5. **Cost Effective** - Pay only for usage
6. **Built-in SSL** - Automatic HTTPS certificates

## Limitations

- **Cold Start Latency** - First request may be slower
- **Function Timeout** - 10 second execution limit
- **Memory Limits** - 1GB max memory per function
- **No Persistent Connections** - Each request creates new DB connection

## Troubleshooting

### Authentication Issues
```bash
# Check if functions are deployed
curl https://YOUR_SITE_URL/.netlify/functions/auth-session

# Check MongoDB connection
# Look at Netlify function logs in dashboard
```

### Local Development Issues
```bash
# Make sure .env variables are set
# Use netlify dev instead of npm run dev
# Check netlify/functions/package.json dependencies
```

### Database Connection Issues
```bash
# Verify MONGODB_URI format
# Check MongoDB Atlas IP whitelist
# Verify database user permissions
```

## Next Steps

After authentication is working:

1. **Add Harvest Endpoints** - Create Netlify Functions for harvest CRUD
2. **Add Admin Endpoints** - Functions for managing produce types/categories  
3. **Add Dashboard Functions** - Aggregate data for dashboard
4. **Implement Email** - For password reset functionality
5. **Add Monitoring** - Error tracking and performance monitoring

## Production Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Secure admin password
- [ ] MongoDB Atlas IP restrictions
- [ ] Environment variables set in Netlify
- [ ] Admin user initialized
- [ ] Test all auth flows
- [ ] Monitor function performance
- [ ] Set up error alerting