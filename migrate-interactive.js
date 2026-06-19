#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const migrations = fs.readdirSync(migrationsDir).sort();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Creator Marketplace Database Migration Guide              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Since direct database connections are restricted, please follow these steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/jxdfehyciufcppxrtjez/sql/new');
  console.log('2. Copy and paste each migration SQL below');
  console.log('3. Click "Run" to execute each one\n');

  let continueProcessing = true;

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Migration: ${migration}`);
    console.log(`${'═'.repeat(60)}`);
    console.log('\nSQL to execute:\n');
    console.log(sql);
    console.log(`\n${'═'.repeat(60)}\n`);

    const choice = await question(
      'Have you executed this migration in Supabase? (y/n/q for quit): '
    );

    if (choice.toLowerCase() === 'q') {
      continueProcessing = false;
      break;
    }

    if (choice.toLowerCase() !== 'y') {
      console.log('\n⚠️  Please execute the migration before continuing.\n');
    }
  }

  if (continueProcessing) {
    console.log('\n✅ All migrations have been executed!');
    console.log('\nYour database schema is now set up. You can start using your application.\n');
  } else {
    console.log('\nMigration setup incomplete. You can run this script again to continue.\n');
  }

  rl.close();
}

main().catch(console.error);
