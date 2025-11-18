import ClientSideModelsList from "@/components/realtime/ClientSideModelsList";
import { Pool } from 'pg';

export const dynamic = "force-dynamic";

export default async function Index() {
  // TODO: Add proper authentication later - for now using mock user
  const userId = 'mock-user-id';
  
  const pool = new Pool({
    connectionString: process.env.AZURE_POSTGRES_URL,
  });
  
  const client = await pool.connect();
  
  try {
    // Get generation jobs with uploaded photos
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
      [userId]
    );

    const models = modelsResult.rows;

    // Transform data to match expected interface
    const modelsWithSamples = models?.map(model => ({
      ...model,
      samples: model.uploaded_photos || [],
      uploaded_photos: model.uploaded_photos || []
    }));

    return <ClientSideModelsList serverModels={modelsWithSamples || []} />;
    
  } catch (error) {
    console.error('Error fetching models:', error);
    return <div>Error loading models</div>;
  } finally {
    client.release();
    await pool.end();
  }
}
