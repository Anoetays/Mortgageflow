import supabase from '../config/supabase.js';

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    // 1. Create users table (for officers)
    console.log('📝 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('Loan Officer', 'Branch Manager', 'Credit Admin')),
          initials TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `
    });

    if (usersError && !usersError.message.includes('already exists')) {
      console.error('❌ Error creating users table:', usersError.message);
    } else {
      console.log('✓ Users table ready');
    }

    // 2. Create applications table
    console.log('📝 Creating applications table...');
    const { error: appsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY,
          applicant_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          national_id TEXT,
          date_of_birth DATE,
          address TEXT,
          marital_status TEXT,
          dependants INTEGER DEFAULT 0,
          
          -- Employment
          employment_status TEXT,
          employer TEXT,
          gross_monthly_income DECIMAL(12, 2),
          monthly_expenses DECIMAL(12, 2),
          existing_loans DECIMAL(12, 2),
          years_employed INTEGER,
          
          -- Property
          property_address TEXT,
          property_type TEXT,
          purchase_price DECIMAL(12, 2),
          deposit_amount DECIMAL(12, 2),
          loan_amount DECIMAL(12, 2),
          loan_term INTEGER,
          willing_seller BOOLEAN,
          
          -- Application Status
          stage TEXT DEFAULT 'intake' CHECK (stage IN ('intake', 'docs', 'assessment', 'approval', 'offer', 'complete')),
          declined BOOLEAN DEFAULT FALSE,
          declined_reason TEXT,
          
          -- Credit Assessment
          credit_score INTEGER,
          credit_outcome TEXT,
          credit_notes TEXT,
          
          -- Counter Offer
          counter_offer_amount DECIMAL(12, 2),
          counter_offer_term INTEGER,
          counter_offer_note TEXT,
          counter_offer_status TEXT CHECK (counter_offer_status IN ('pending', 'accepted', 'declined')),
          counter_offer_issued_by TEXT,
          counter_offer_issued_date TIMESTAMPTZ,
          
          -- Document Status
          doc_id_received BOOLEAN DEFAULT FALSE,
          doc_payslips_received BOOLEAN DEFAULT FALSE,
          doc_bank_statements_received BOOLEAN DEFAULT FALSE,
          doc_employment_letter_received BOOLEAN DEFAULT FALSE,
          doc_proof_residence_received BOOLEAN DEFAULT FALSE,
          
          -- Timestamps
          submitted_at TIMESTAMPTZ DEFAULT now(),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
        CREATE INDEX IF NOT EXISTS idx_applications_declined ON applications(declined);
        CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON applications(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
      `
    });

    if (appsError && !appsError.message.includes('already exists')) {
      console.error('❌ Error creating applications table:', appsError.message);
    } else {
      console.log('✓ Applications table ready');
    }

    // 3. Create application history table
    console.log('📝 Creating application_history table...');
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS application_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          stage TEXT NOT NULL,
          action_by UUID REFERENCES users(id) ON DELETE SET NULL,
          message TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_app_history_app_id ON application_history(application_id);
        CREATE INDEX IF NOT EXISTS idx_app_history_created_at ON application_history(created_at);
      `
    });

    if (historyError && !historyError.message.includes('already exists')) {
      console.error('❌ Error creating application_history table:', historyError.message);
    } else {
      console.log('✓ Application history table ready');
    }

    // 4. Create documents table
    console.log('📝 Creating documents table...');
    const { error: docsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          uploaded_at TIMESTAMPTZ DEFAULT now(),
          uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_documents_app_id ON documents(application_id);
        CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
      `
    });

    if (docsError && !docsError.message.includes('already exists')) {
      console.error('❌ Error creating documents table:', docsError.message);
    } else {
      console.log('✓ Documents table ready');
    }

    // 5. Create seed users (demo officers)
    console.log('📝 Seeding demo officers...');
    const DEMO_OFFICERS = [
      { email: 'officer@mortgageflow.com', name: 'T. Moyo', role: 'Loan Officer', initials: 'TM' },
      { email: 'manager@mortgageflow.com', name: 'S. Ncube', role: 'Branch Manager', initials: 'SN' },
      { email: 'credit@mortgageflow.com', name: 'R. Dube', role: 'Credit Admin', initials: 'RD' }
    ];

    for (const officer of DEMO_OFFICERS) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: officer.email,
        password: officer.email === 'officer@mortgageflow.com' ? 'MF2026' 
                : officer.email === 'manager@mortgageflow.com' ? 'MGR2026'
                : 'CRD2026',
        email_confirm: true,
        user_metadata: {
          name: officer.name,
          role: officer.role,
          initials: officer.initials
        }
      });

      if (error) {
        console.log(`⚠ Officer ${officer.email} may already exist:`, error.message);
      } else {
        console.log(`✓ Created officer: ${officer.email}`);
      }
    }

    console.log('\n✅ Database migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('2. Run: npm start');
    console.log('3. Update frontend API endpoints to point to your backend URL\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
