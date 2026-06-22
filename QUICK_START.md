# 🚀 MortgageFlow Quick Start

Your backend is now configured with Supabase! Follow these steps to get everything running.

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Set Up Supabase Storage Bucket
Go to your Supabase Dashboard:
1. https://supabase.com/dashboard/project/orxnyankigjljusxivyp
2. Click **Storage** (left sidebar)
3. Click **Create Bucket**
4. Name: `documents`
5. Toggle **Public Bucket** ON
6. Click **Create**

### Step 3: Create Database Tables
```bash
npm run migrate
```

You should see:
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

### Step 4: Start Backend Server
```bash
npm start
```

You should see:
```
🚀 MortgageFlow Backend running on http://localhost:5000
```

### Step 5: Update Frontend
Open `mortgageflow_v4.html` - at the very TOP of the `<script>` section, add:

```html
<script src="api-client.js"></script>
<script>
  // Replace localhost:3000 with your actual frontend URL if deployed
  const API_CONFIG = {
    baseURL: 'http://localhost:5000/api'
  };
</script>
```

### Step 6: Update Function Calls
Find and replace these functions in the main script:

**Find:**
```javascript
function submitApplication() {
```

**Replace with:**
```javascript
function submitApplication() {
  // Use API instead of localStorage
  return submitApplicationViaAPI();
}

// Add this new function:
function submitApplicationViaAPI() {
```

**Find:**
```javascript
function trackApplication() {
```

**Replace with:**
```javascript
function trackApplication() {
  return trackApplicationViaAPI();
}

function trackApplicationViaAPI() {
```

**Find:**
```javascript
function doLogin() {
```

**Replace with:**
```javascript
function doLogin() {
  return doLoginViaAPI();
}

async function doLoginViaAPI() {
```

## 🧪 Testing

### Test 1: Check Backend is Running
```
Visit: http://localhost:5000/api/health
Expected: { "status": "ok", "message": "..." }
```

### Test 2: Submit Application
1. Open `mortgageflow_v4.html` in browser
2. Click "Apply for a Loan"
3. Fill in form and submit
4. Should get Application ID like `MF-482931`

### Test 3: Login as Officer
1. Click "Officer Login"
2. Email: `officer@mortgageflow.com`
3. Password: `MF2026`
4. Should see Dashboard

### Test 4: Check Supabase Database
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Run: `SELECT * FROM applications;`
4. Should see your submitted applications

### Test 5: Verify File Storage
1. Go to Supabase **Storage**
2. Click **documents** bucket
3. Upload a file through the app
4. File should appear here

## 📱 API Endpoints (for testing)

### Test with curl or Postman:

**Submit Application:**
```bash
curl -X POST http://localhost:5000/api/applications/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fname": "Test",
    "lname": "User",
    "phone": "+263771234567",
    "email": "test@example.com",
    "price": "50000",
    "deposit": "10000",
    "income": "3000"
  }'
```

**Login Officer:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer@mortgageflow.com",
    "password": "MF2026"
  }'
```

**Track Application:**
```bash
curl http://localhost:5000/api/applications/track/MF-482931
```

## 🎯 Demo Officers (for testing)

| Role | Email | Password |
|------|-------|----------|
| Loan Officer | officer@mortgageflow.com | MF2026 |
| Branch Manager | manager@mortgageflow.com | MGR2026 |
| Credit Admin | credit@mortgageflow.com | CRD2026 |

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 (or your file location) |
| Backend | http://localhost:5000 |
| Supabase Dashboard | https://supabase.com/dashboard/project/orxnyankigjljusxivyp |
| Backend Logs | Check terminal where `npm start` is running |

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Supabase documents bucket created and public
- [ ] Database tables created (check Supabase SQL Editor)
- [ ] Demo officers created in auth table
- [ ] Frontend includes api-client.js
- [ ] Can submit application and get ID
- [ ] Can login as officer
- [ ] Can see applications in dashboard
- [ ] Can upload documents
- [ ] Documents appear in Supabase Storage

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Check if port 5000 is in use
# Kill the process or change PORT in .env
```

**"Cannot find module" errors:**
```bash
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

**Database migration fails:**
- Check SUPABASE_SERVICE_ROLE_KEY in .env
- Verify Supabase project is active

**CORS errors in frontend:**
- Update FRONTEND_URL in backend .env
- Restart backend server

**Files not uploading:**
- Check documents bucket exists
- Verify bucket is PUBLIC
- Check file size < 5MB

## 📞 Next Steps

1. ✅ Backend configured
2. ✅ Database set up  
3. Update frontend code
4. Test all features
5. Deploy to production

## 🎉 You're Ready!

Your MortgageFlow system is now live! Start with testing and iterate from there.
