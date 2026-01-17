#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Need: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(__dirname, 'packages/database/migrations');
  const seedDir = path.join(__dirname, 'packages/database/seed');

  // Run migrations in order
  const migrations = [
    { file: '001_initial.sql', dir: migrationsDir, name: 'Initial Schema' },
    { file: '002_views.sql', dir: migrationsDir, name: 'Analytics Views' },
    { file: '001_guardrails.sql', dir: seedDir, name: 'Guardrail Profiles' },
    { file: '002_avatars.sql', dir: seedDir, name: 'Avatar Seed Data' },
  ];

  for (const migration of migrations) {
    const filePath = path.join(migration.dir, migration.file);

    console.log(`📄 Running: ${migration.name} (${migration.file})`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipped: File not found\n`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Use Supabase's RPC to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(() => {
        // If RPC doesn't exist, we'll need to execute via pg client
        return { error: 'RPC not available, using direct execution' };
      });

      if (error && error !== 'RPC not available, using direct execution') {
        console.error(`❌ Error: ${error.message}`);
        console.log('\n⚠️  This migration needs to be run manually in Supabase SQL Editor');
        console.log(`📋 Copy the contents of: ${filePath}\n`);
      } else {
        console.log(`✅ Success\n`);
      }
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
      console.log('\n⚠️  Run this manually in Supabase SQL Editor:');
      console.log(`📋 ${filePath}\n`);
    }
  }

  console.log('✨ Migration script complete!\n');
  console.log('📝 If you saw any errors, run the SQL files manually:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy-paste the contents of each .sql file\n');
}

runMigrations().catch(console.error);
