require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testPostgresConnection() {
  console.log('🔍 Connection string:', process.env.AZURE_POSTGRES_URL);
  
  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL
  });

  try {
    console.log('Testing Azure PostgreSQL connection...');
    await client.connect();
    console.log('✅ Connected to Azure PostgreSQL successfully!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // List databases
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('🗄️ Available databases:', dbResult.rows.map(row => row.datname));
    
    await client.end();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Full error:', error);
    process.exit(1);
  }
}

testPostgresConnection();
