// server/setup-database.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL server...');
    
    // Connect without database specified first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log('📦 Creating database if not exists...');
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${process.env.DB_NAME}' ready`);

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Read and execute schema file
    console.log('📋 Running database schema...');
    const schema = fs.readFileSync('./migrations/001_initial_schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log('✅ Database schema created successfully');

    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();