import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import db from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('🚀 Running migration: 002_template_assignment_rules.sql\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '002_template_assignment_rules.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      
      try {
        await db.execute(statement);
        console.log(`✅ Success\n`);
      } catch (error) {
        // Ignore "Duplicate column" errors (migration already run)
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column already exists, skipping\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✨ Migration completed successfully!');
    console.log('\n📊 Verifying tables...');

    // Verify the new table exists
    const [tables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'template_assignment_rules'
    `);

    if (tables.length > 0) {
      console.log('✅ template_assignment_rules table created');

      // Check columns
      const [columns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'template_assignment_rules'
      `);
      console.log(`   Columns: ${columns.map(c => c.COLUMN_NAME).join(', ')}`);
    }

    // Verify shops table updates
    const [shopColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'shops'
      AND COLUMN_NAME IN ('template_rule_exclusion_tag', 'last_rule_application')
    `);

    if (shopColumns.length === 2) {
      console.log('✅ shops table updated with new columns');
    }

    console.log('\n🎉 All done!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();