// Run the trial_expires_at migration
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Railway database connection
const db = mysql.createPool({
  host: 'turntable.proxy.rlwy.net',
  user: 'root',
  password: 'ctVFdDmcnRZMPCCdEnmrTTbsHnurDXMW',
  database: 'railway',
  port: 50440,
  waitForConnections: true,
  connectionLimit: 10
});

async function runMigration() {
  console.log('Running trial_expires_at migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '010_add_trial_expiration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      console.log('Executing:', statement.trim().substring(0, 50) + '...');
      await db.execute(statement);
      console.log('✓ Success');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

runMigration().catch(console.error);
