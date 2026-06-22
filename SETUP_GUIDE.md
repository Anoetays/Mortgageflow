# 🚀 MortgageFlow - Complete Setup Guide

## Overview

MortgageFlow is a full-stack mortgage pipeline management system consisting of:
- **Frontend**: Single HTML file with vanilla JavaScript
- **Backend**: Node.js/Express REST API
- **Database**: Supabase (PostgreSQL) for storage and authentication
- **File Storage**: Supabase Storage for document management

## 📋 Prerequisites

1. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Get your project URL and API keys

2. **Node.js**
   - Download from https://nodejs.org (v14+ recommended)
   - Verify installation: `node --version`

3. **Code Editor**
   - VS Code recommended: https://code.visualstudio.com

## 🔧 Step-by-Step Setup

### Step 1: Supabase Configuration

1. Go to https://supabase.com/dashboard
2. Open your project (or create a new one)
3. Go to **Settings → API** to find:
   - `Project URL` - Save this
   - `anon public` key - Save this
   - `service_role` key - Save this (keep secure!)

4. Create Storage Bucket:
   - Go to **Storage**
   - Click **Create Bucket**
   - Name: `documents`
   - Click **Create**
   - Make it public

### Step 2: Backend Setup

1. Navigate to the backend directory:
```bash
cd path/to/mortgage#/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your Supabase credentials:
```bash
cp .env.example .env
```

4. Edit `.env` and add:
```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
JWT_SECRET=a-random-secret-key-change-this-in-production
```

5. Run migrations to create database tables:
```bash
npm run migrate
```

Expected output:
```
🚀 Starting database migrations...
✓ Users table ready
✓ Applications table ready
✓ Application history table ready
✓ Documents table ready
✓ Created officer: officer@mortgageflow.com
✓ Created officer: manager@mortgageflow.com
✓ Created officer: credit@mortgageflow.com
✅ Database migrations completed successfully!
```

6. Start the backend server:
```bash
npm start
```

Expected output:
```
🚀 MortgageFlow Backend running on http://localhost:5000
```

### Step 3: Frontend Setup

1. Update the API endpoint in your HTML file:

Find this line in `mortgageflow_v4.html`:
```javascript
const API_BASE = 'http://localhost:5000/api';
```

2. Include the API client before the main script:
```html
<script src="api-client.js"></script>
```

3. Update function calls:
   - Change `submitApplication()` → `submitApplicationViaAPI()`
   - Change `trackApplication()` → `trackApplicationViaAPI()`
   - Change `doLogin()` → `doLoginViaAPI()`
   - Change `renderDashboard()` → `renderDashboardViaAPI()`

4. Open `mortgageflow_v4.html` in a web browser

## 🧪 Testing the System

### Test 1: Submit Application (Public)

1. Open the application in browser
2. Click "Apply for a Loan"
3. Fill out all form fields
4. Submit application
5. Check backend console for logs
6. Check Supabase dashboard → applications table

### Test 2: Officer Login

1. Click "Officer Login"
2. Use demo credentials:
   ```
   Email: officer@mortgageflow.com
   Password: MF2026
   ```
3. Should see Dashboard with empty applications

### Test 3: Track Application

1. From welcome screen, click "Track Application"
2. Enter the Application ID from submission (MF-XXXXXX)
3. Should see application status and progress

### Test 4: Upload Document

1. Login as officer
2. Go to an application in dashboard
3. Click "Review"
4. Upload a PDF or image file
5. Check Supabase Storage → documents bucket

## 📱 API Reference

### Public Endpoints

**Submit Application**
```
POST /api/applications/submit
Body: {
  fname, lname, phone, email, nationalId, dob, address, 
  maritalStatus, dependants, empStatus, employer, income, 
  expenses, loans, yearsEmployed, propAddr, propType, 
  price, deposit, term, willingSeller
}
Response: { success: true, applicationId: "MF-XXXXXX" }
```

**Track Application**
```
GET /api/applications/track/MF-XXXXXX
Response: { success: true, application: {...} }
```

### Protected Endpoints (Require JWT Token)

**Officer Login**
```
POST /api/auth/login
Body: { email, password }
Response: { success: true, token: "jwt...", user: {...} }
```

**Get Applications**
```
GET /api/applications
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, applications: [...], total: 0 }
```

**Update Application Stage**
```
PUT /api/applications/:id/stage
Headers: { Authorization: "Bearer <token>" }
Body: { stage: "docs", message: "Moving to docs" }
Response: { success: true, application: {...} }
```

**Upload Document**
```
POST /api/documents/upload
Body: FormData with { file, applicationId, documentType }
Response: { success: true, document: {...} }
```

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Never commit `.env` file to git
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Enable RLS policies on Supabase
- [ ] Use Service Role Key only on backend
- [ ] Validate all inputs on backend
- [ ] Implement rate limiting
- [ ] Set up SSL certificates
- [ ] Use environment-specific keys

## 🚀 Deployment

### Deploy Backend to Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

2. Login to Heroku:
```bash
heroku login
```

3. Create Heroku app:
```bash
heroku create your-mortgageflow-app
```

4. Set environment variables:
```bash
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_KEY=...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
heroku config:set JWT_SECRET=your-secret
```

5. Deploy:
```bash
git push heroku main
```

### Deploy Frontend

1. Upload `mortgageflow_v4.html` and `api-client.js` to:
   - Netlify (drag & drop)
   - Vercel
   - GitHub Pages
   - Any web hosting

2. Update API endpoint in HTML to your deployed backend URL

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module '@supabase/supabase-js'" | Run `npm install` |
| "Missing SUPABASE_URL" | Check `.env` file, verify Supabase credentials |
| "CORS error" | Update `FRONTEND_URL` in backend `.env` |
| "401 Unauthorized" | Token expired or invalid, login again |
| "File upload fails" | Check storage bucket exists, file size < 5MB |
| "Database connection fails" | Verify Supabase URL and service role key |

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Express Docs**: https://expressjs.com
- **Multer Docs**: https://github.com/expressjs/multer
- **JWT Docs**: https://jwt.io

## 📊 Database Schema

All tables are automatically created by the migration script. Schema includes:

- **users**: Officer/staff accounts with role-based access
- **applications**: Mortgage application data
- **application_history**: Audit trail of all changes
- **documents**: Metadata for uploaded files

## 🎯 Next Steps

1. ✅ Set up Supabase project
2. ✅ Install and configure backend
3. ✅ Run database migrations
4. ✅ Start backend server
5. ✅ Update frontend with API client
6. ✅ Test all features
7. Deploy to production

## 📝 Notes

- Demo data is seeded automatically on migration
- All data is stored in your Supabase project
- Document files are stored in Supabase Storage (public bucket)
- Application history tracks all changes for audit trails
- Role-based access control enforced at API level

## 🎉 You're Ready!

Your MortgageFlow system is now ready to use. Visit `http://localhost:3000` (or your frontend URL) to start managing mortgages!
