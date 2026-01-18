const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    const sql = fs.readFileSync(path.join(__dirname, 'packages/database/migrations/006_link_sessions_to_questions.sql'), 'utf8');

    console.log('Running SQL...');
    // Since we don't have exec_sql RPC by default in all projects, we might need a workaround 
    // or just ask the user to run it if it fails.
    // Actually, I'll try to use the REST API to check if it worked after updating actions.

    // NOTE: This usually requires a special RPC called 'exec_sql' or similar to be defined.
    // If it's not defined, this will fail.
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        console.error('Error running SQL:', error);
        process.exit(1);
    } else {
        console.log('SQL ran successfully!');
    }
}

runSql();
