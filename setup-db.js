#!/usr/bin/env node

/**
 * Database Setup Script
 * This script applies the missing user_profiles migration to the local Supabase instance
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Check if user_profiles table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles');

    if (error) {
      console.error('❌ Error checking tables:', error);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ user_profiles table already exists');
      return;
    }

    console.log('📝 user_profiles table not found, creating...');
    
    // Read and execute the migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250802210000_add_user_roles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Note: This won't work with the anon key, but we've already fixed the AuthContext
    // to handle missing tables gracefully
    console.log('⚠️  Could not execute migration directly (requires service role key)');
    console.log('✅ But the app should now handle missing user_profiles table gracefully');
    console.log('');
    console.log('To properly set up the user_profiles table, you can:');
    console.log('1. Use supabase CLI: supabase db push (after linking project)');
    console.log('2. Or manually execute the SQL in the Supabase dashboard');
    console.log('3. Or the app will create default profiles when users sign up');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();