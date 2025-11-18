const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Azure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRES_URL || 'postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/postgres?sslmode=require',
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up Azure PostgreSQL database...');
    
    // Create users table (simplified for future use)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create credits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credits (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Credits table created');
    
    // Create generation_jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generation_jobs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL DEFAULT 'profileperfect',
        status VARCHAR(50) NOT NULL DEFAULT 'processing',
        model_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Generation jobs table created');
    
    // Create uploaded_photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_photos (
        id SERIAL PRIMARY KEY,
        model_id INTEGER NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
        uri VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Uploaded photos table created');
    
    // Create images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        model_id INTEGER NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        is_favorited BOOLEAN DEFAULT FALSE,
        style_preset VARCHAR(100),
        background_preset VARCHAR(100),
        source VARCHAR(100) DEFAULT 'generated',
        parent_image_id INTEGER REFERENCES images(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Images table created');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_images_model_id ON images(model_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_uploaded_photos_model_id ON uploaded_photos(model_id)');
    console.log('✅ Indexes created');
    
    // Insert mock user credits
    await client.query(`
      INSERT INTO credits (user_id, credits) 
      VALUES ('mock-user-id', 10) 
      ON CONFLICT (user_id) DO UPDATE SET credits = 10
    `);
    console.log('✅ Mock user credits inserted');
    
    // Insert sample generation job
    const jobResult = await client.query(`
      INSERT INTO generation_jobs (user_id, name, type, status, model_id) 
      VALUES ('mock-user-id', 'Sample Model', 'profileperfect', 'completed', 'sample_model_001')
      ON CONFLICT DO NOTHING 
      RETURNING id
    `);
    
    if (jobResult.rows.length > 0) {
      const sampleJobId = jobResult.rows[0].id;
      console.log(`✅ Sample job created with ID: ${sampleJobId}`);
      
      // Insert sample uploaded photos
      await client.query(`
        INSERT INTO uploaded_photos (model_id, uri) 
        VALUES 
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample1.jpg'),
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample2.jpg'),
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample3.jpg')
        ON CONFLICT DO NOTHING
      `, [sampleJobId]);
      console.log('✅ Sample uploaded photos inserted');
      
      // Insert sample generated images
      await client.query(`
        INSERT INTO images (model_id, url, is_favorited, style_preset, background_preset, source) 
        VALUES 
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated1.jpg', FALSE, 'corporate', 'office', 'profileperfect-ai'),
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated2.jpg', TRUE, 'startup', 'creative', 'profileperfect-ai'),
          ($1, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated3.jpg', FALSE, 'corporate', 'studio', 'profileperfect-ai')
        ON CONFLICT DO NOTHING
      `, [sampleJobId]);
      console.log('✅ Sample generated images inserted');
    }
    
    console.log('🎉 Azure PostgreSQL database setup complete!');
    console.log('📊 Database is now ready for testing the ProfilePerfect AI app.');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);
