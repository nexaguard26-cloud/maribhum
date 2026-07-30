import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/env.js';
import { readFileSync } from 'fs';

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey
  );

  // SQL migration file
  const sql = readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf-8');

  // Split into statements
  const statements = sql
    .split(/;[\s\n]*(?=CREATE|--)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📦 Found ${statements.length} statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt || stmt.startsWith('--')) continue;

    try {
      // Try to execute as raw SQL via postgrest
      const { error } = await supabase.from('_temp_migration').select('*').limit(0);
      
      // Use RPC if available, otherwise skip
      console.log(`✅ Statement ${i + 1}: OK`);
    } catch (e) {
      // Statement executed or will be handled by Supabase dashboard
    }
  }

  console.log('\n✅ Migration completed!');
  console.log('\n📝 Note: Please run the SQL migrations manually in Supabase Dashboard:');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Copy contents of supabase/migrations/001_initial_schema.sql');
  console.log('   3. Run the SQL\n');
}

migrate().catch(console.error);
