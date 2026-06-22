# MortgageFlow Backend

MortgageFlow is a comprehensive mortgage pipeline management system built with Node.js, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn
- Supabase account with the following Supabase project credentials:
  - Project URL
  - Anon Key
  - Service Role Key

### Installation

1. **Clone/Download the project**
```bash
cd backend
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your details:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
NODE_ENV=development
JWT_SECRET=your_random_secret_key_here
FRONTEND_URL=http://localhost:3000
```

3. **Run database migrations**

This creates all necessary tables in your Supabase database:

```bash
npm run migrate
```

This will:
- Create `users` table for officer authentication
- Create `applications` table for mortgage applications
- Create `application_history` table for tracking changes
- Create `documents` table for document records
- Seed demo officer accounts

4. **Start the server**

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Officer login
- `GET /api/auth/verify` - Verify authentication token
- `POST /api/auth/logout` - Logout

### Applications
- `POST /api/applications/submit` - Submit new application (public)
- `GET /api/applications/track/:id` - Track application status (public)
- `GET /api/applications` - List applications (protected)
- `GET /api/applications/:id` - Get application details (protected)
- `PUT /api/applications/:id/stage` - Update application stage
- `POST /api/applications/:id/credit-assessment` - Save credit assessment
- `POST /api/applications/:id/manager-decision` - Manager approval/decline decision
- `POST /api/applications/:id/counter-offer` - Send counter-offer
- `PUT /api/applications/:id/counter-offer/status` - Update counter-offer status
- `GET /api/applications/analytics` - Get analytics data

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/application/:applicationId` - Get application documents
- `GET /api/documents/url/:filePath` - Get document download URL
- `DELETE /api/documents/:id` - Delete document (protected)

## 🔐 Authentication

The backend uses JWT tokens for authentication. When an officer logs in:

1. Supabase authenticates the credentials
2. A JWT token is generated with a 7-day expiration
3. Token must be sent in the Authorization header for protected routes:

```
Authorization: Bearer <token>
```

### Demo Officers

For testing, three demo officers are automatically created:

- **Loan Officer**
  - Email: `officer@mortgageflow.com`
  - Password: `MF2026`

- **Branch Manager**
  - Email: `manager@mortgageflow.com`
  - Password: `MGR2026`

- **Credit Admin**
  - Email: `credit@mortgageflow.com`
  - Password: `CRD2026`

## 📁 Supabase Setup

### Storage Bucket
Create a public storage bucket named `documents` for storing application documents:

1. Go to Supabase Dashboard
2. Storage → Create Bucket
3. Name: `documents`
4. Make public
5. Set file size limit to 5MB

### RLS Policies

Create Row Level Security policies:

**Allow public uploads:**
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents');
```

**Allow authenticated users to view:**
```sql
CREATE POLICY "Allow authenticated users to view" ON storage.objects
FOR SELECT USING (true);
```

**Allow service role to manage:**
```sql
CREATE POLICY "Service role access" ON storage.objects
USING (auth.role() = 'service_role');
```

## 🗂️ Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase client setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── applicationsController.js  # Application CRUD & business logic
│   └── documentsController.js     # Document upload/management
├── middleware/
│   └── auth.js              # JWT verification & authorization
├── routes/
│   ├── auth.js              # Auth routes
│   ├── applications.js       # Application routes
│   └── documents.js          # Document routes
├── scripts/
│   └── migrate.js            # Database migrations
├── server.js                 # Main Express app
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔗 Frontend Integration

Update your frontend to use the API endpoints:

```javascript
const API_BASE = 'http://localhost:5000/api';

// Submit application
const response = await fetch(`${API_BASE}/applications/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(applicationData)
});

// Login officer
const loginResponse = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Upload document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('applicationId', appId);
formData.append('documentType', 'national-id');

const uploadResponse = await fetch(`${API_BASE}/documents/upload`, {
  method: 'POST',
  body: formData
});
```

## 🛡️ Security Best Practices

1. **Rotate JWT_SECRET regularly** in production
2. **Never commit `.env` file** to version control
3. **Use HTTPS** in production
4. **Set proper CORS origins** for your frontend
5. **Enable RLS policies** on all Supabase tables
6. **Validate all inputs** on the backend
7. **Use Service Role Key only on backend** (never expose to frontend)
8. **Implement rate limiting** for production

## 📊 Database Schema

### users
- `id`: UUID (Primary Key)
- `email`: TEXT (Unique)
- `password_hash`: TEXT
- `name`: TEXT
- `role`: TEXT (Enum: 'Loan Officer', 'Branch Manager', 'Credit Admin')
- `initials`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

### applications
- `id`: TEXT (MF-XXXXXX format, Primary Key)
- Personal info fields (name, phone, email, etc.)
- Employment info fields
- Property info fields
- Application status (stage, declined, etc.)
- Credit assessment fields
- Counter-offer fields
- Document receipt status flags
- Timestamps

### application_history
- `id`: UUID (Primary Key)
- `application_id`: TEXT (Foreign Key)
- `stage`: TEXT
- `action_by`: UUID (Foreign Key to users)
- `message`: TEXT
- `created_at`: TIMESTAMPTZ

### documents
- `id`: UUID (Primary Key)
- `application_id`: TEXT (Foreign Key)
- `document_type`: TEXT
- `file_name`: TEXT
- `file_path`: TEXT (path in storage)
- `file_size`: INTEGER
- `mime_type`: TEXT
- `uploaded_at`: TIMESTAMPTZ
- `uploaded_by`: UUID (Foreign Key to users)

## 🐛 Troubleshooting

### "Missing SUPABASE_URL"
- Check .env file is properly configured
- Verify Supabase credentials are correct

### "Database migration fails"
- Ensure Supabase service role key has admin permissions
- Check that your Supabase project is accessible

### "CORS errors"
- Update `FRONTEND_URL` in .env to match your frontend URL
- Ensure frontend sends proper Content-Type headers

### "File upload fails"
- Create the `documents` storage bucket in Supabase
- Check file size (max 5MB)
- Verify file format (PDF, JPG, PNG only)

## 📞 Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review API error messages in console
3. Check browser DevTools for network requests

## 📄 License

MortgageFlow Backend © 2024 - Built for secure mortgage pipeline management
