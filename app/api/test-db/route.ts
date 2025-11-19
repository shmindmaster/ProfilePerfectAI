import { Pool } from 'pg';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PostgreSQL connection pool (prefer DATABASE_URL, fallback to legacy AZURE_POSTGRES_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.AZURE_POSTGRES_URL,
});

export async function GET() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Azure PostgreSQL connection...');
    
    // Test basic connection
    const versionResult = await client.query('SELECT version()');
    console.log('✅ PostgreSQL version:', versionResult.rows[0].version);
    
    // Test credits query (same as overview page)
    const creditsResult = await client.query(
      'SELECT credits FROM credits WHERE user_id = $1',
      ['mock-user-id']
    );
    console.log('📊 Credits result:', creditsResult.rows);
    
    // Test the exact query from overview page
    const modelsResult = await client.query(
      `SELECT gj.*, 
              json_agg(
                json_build_object(
                  'id', up.id,
                  'uri', up.uri,
                  'created_at', up.created_at
                )
              ) as uploaded_photos
       FROM generation_jobs gj
       LEFT JOIN uploaded_photos up ON gj.id = up.model_id
       WHERE gj.user_id = $1
       GROUP BY gj.id
       ORDER BY gj.created_at DESC`,
      ['mock-user-id']
    );
    
    console.log('📋 Models query result:', JSON.stringify(modelsResult.rows, null, 2));
    
    // Test images query
    const imagesResult = await client.query(
      'SELECT * FROM images WHERE model_id = $1 ORDER BY created_at DESC',
      [1] // Using the sample job ID we created
    );
    
    console.log('🖼️ Images result:', imagesResult.rows);
    
    return NextResponse.json({
      success: true,
      postgresql: {
        version: versionResult.rows[0].version,
        credits: creditsResult.rows,
        models: modelsResult.rows,
        images: imagesResult.rows,
      }
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    client.release();
  }
}
