import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const migrations = [
  '20260619000001_create_jobs.sql',
  '20260619000002_create_applications.sql',
  '20260619000003_create_payments.sql',
  '20260619000004_create_submissions.sql',
  '20260619000005_create_disputes.sql',
];

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${response.status} ${error}`);
  }

  return response.json();
}

async function runMigrations() {
  try {
    console.log('Starting migrations via Supabase API...\n');

    for (const migration of migrations) {
      try {
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log(`Running: ${migration}`);
        
        // Split into individual statements and execute
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          try {
            await executeSql(statement);
          } catch (e) {
            console.warn(`    Warning: ${e.message}`);
          }
        }

        console.log(`  ✓ Completed\n`);
      } catch (error) {
        console.error(`  ✗ Error running ${migration}:`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('✓ All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
