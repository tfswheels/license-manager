// server/run-migration.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Connected to database');

    // Read migration file
    console.log('📋 Reading migration file...');
    const migration = fs.readFileSync('./migrations/002_email_templates.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migration
      .split(';')
      .map(s => {
        // Remove comment lines
        return s.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0);

    console.log(`📦 Executing ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. Executing statement...`);
      await connection.query(statement);
      console.log('   ✅ Done');
    }

    console.log('\n🎉 Migration completed successfully!');

    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Current tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();