# Running Database Migrations

Due to network restrictions on direct database connections, you'll need to run the migrations manually through the Supabase dashboard.

## Option 1: Quick Copy-Paste (Recommended)

1. Open the combined migrations file: [MIGRATIONS_COMBINED.sql](./MIGRATIONS_COMBINED.sql)
2. Copy all the SQL code
3. Go to: https://supabase.com/dashboard/project/jxdfehyciufcppxrtjez/sql/new
4. Paste the SQL into the editor
5. Click the **Run** button (or press `Ctrl+Enter`)

That's it! All 5 migrations will be executed at once.

## Option 2: Run Individual Migrations

If you prefer to run them one at a time:

1. Go to: https://supabase.com/dashboard/project/jxdfehyciufcppxrtjez/sql/new
2. For each migration file in `supabase/migrations/`, copy the contents and run them in order:
   - `20260619000001_create_jobs.sql`
   - `20260619000002_create_applications.sql`
   - `20260619000003_create_payments.sql`
   - `20260619000004_create_submissions.sql`
   - `20260619000005_create_disputes.sql`

## Verifying Migrations

After running the migrations, you can verify they worked by checking the tables:

1. Go to your Supabase dashboard
2. Click **SQL Editor** → **New query**
3. Run this query to see all tables:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

You should see:
- applications
- disputes
- jobs
- payments
- submissions

## What the Migrations Create

- **jobs**: Job listings created by brands
- **applications**: Creator applications to jobs
- **payments**: Payment records with escrow status
- **submissions**: Work submissions from creators
- **disputes**: Dispute resolution records
- **Policies**: Row-level security policies for all tables

All tables include:
- Automatic `updated_at` timestamps
- Proper foreign keys with cascading deletes
- Indexes for performance
- Row-level security policies for multi-tenant access
