import pkg from 'pg';
const { Client } = pkg;
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

// Extract host from Supabase URL
const url = new URL(supabaseUrl);
const host = url.hostname;

console.log('Connecting to:', host);
console.log('Service role key length:', serviceRoleKey.length);

// Construct connection string - postgres user with service role key
const connectionString = `postgresql://postgres.${supabaseUrl.split('//')[1].split('.')[0]}:${serviceRoleKey}@${host}:5432/postgres?sslmode=require`;

const client = new Client({
  host: host,
  port: 5432,
  database: 'postgres',
  user: `postgres.${supabaseUrl.split('//')[1].split('.')[0]}`,
  password: serviceRoleKey,
  ssl: 'require',
});

const migrations = [
  '20260619000001_create_jobs.sql',
  '20260619000002_create_applications.sql',
  '20260619000003_create_payments.sql',
  '20260619000004_create_submissions.sql',
  '20260619000005_create_disputes.sql',
];

async function runMigrations() {
  try {
    await client.connect();
    console.log('✓ Connected to Supabase database\n');
    console.log('Starting migrations...\n');

    for (const migration of migrations) {
      try {
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log(`Running: ${migration}`);
        await client.query(sql);
        console.log(`  ✓ Completed\n`);
      } catch (error) {
        console.error(`  ✗ Error running ${migration}:`);
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        console.error(`Details:`, error);
        throw error;
      }
    }

    console.log('✓ All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
