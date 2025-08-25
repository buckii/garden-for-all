# Netlify Functions Migration Plan

## Current Issues with Netlify Functions

1. **No persistent server**: Express.js runs continuously, Netlify Functions are stateless
2. **Separate function files**: Each API endpoint becomes a separate function
3. **Database connections**: Need connection pooling for serverless
4. **Authentication**: JWT validation needed per function
5. **CORS**: Each function handles its own CORS

## Required Changes

### 1. Restructure for Serverless Functions

Each API endpoint becomes a separate file in `netlify/functions/`:

```
netlify/functions/
├── auth-signin.js
├── auth-signup.js
├── harvest-list.js
├── harvest-create.js
├── admin-categories.js
└── dashboard-summary.js
```

### 2. MongoDB Connection Optimization

```javascript
// utils/db.js
import mongoose from 'mongoose';

let cachedConnection = null;

export async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 1, // Limit connections for serverless
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedConnection = connection;
  return connection;
}
```

### 3. Example Function Structure

```javascript
// netlify/functions/harvest-create.js
import { connectDB } from '../utils/db.js';
import { HarvestEntry, ProduceType } from '../utils/models.js';
import { validateAuth } from '../utils/auth.js';

export async function handler(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    
    // Optional auth for harvest creation
    let user = null;
    if (event.headers.authorization) {
      user = await validateAuth(event.headers.authorization);
    }

    const data = JSON.parse(event.body);
    
    // Validate produce type exists
    const produceType = await ProduceType.findById(data.produceTypeId);
    if (!produceType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid produce type' })
      };
    }

    const entry = new HarvestEntry({
      ...data,
      harvestDate: new Date(data.harvestDate)
    });

    await entry.save();
    await entry.populate('produceTypeId');

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: entry
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}
```

### 4. Authentication Utility

```javascript
// utils/auth.js
import jwt from 'jsonwebtoken';
import { User } from './models.js';

export async function validateAuth(authHeader) {
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user');
    }
    
    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

export function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
}
```

### 5. Package.json Changes

```json
{
  "type": "module",
  "dependencies": {
    "mongoose": "^8.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### 6. Netlify Configuration

```toml
# netlify.toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
```

### 7. Environment Variables

```bash
# Netlify Environment Variables (set in dashboard)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/garden-for-all
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## Pros of Netlify Functions

- ✅ Serverless scaling
- ✅ Built-in CI/CD with Git
- ✅ Free tier available
- ✅ Edge locations for low latency
- ✅ No server management

## Cons of Netlify Functions

- ❌ Cold starts (latency)
- ❌ More complex architecture
- ❌ Function size limits
- ❌ Execution time limits (10s max)
- ❌ More expensive at scale vs VPS