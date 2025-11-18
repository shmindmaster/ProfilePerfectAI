import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import { generateHeadshots, GenerationRequest } from '@/lib/ai/image-generation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
});

interface GenerateRequest {
  referenceImages: string[];
  stylePreset: string;
  backgroundPreset: string;
  count?: number;
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'standard' | 'high';
}

interface GenerateResponse {
  success: boolean;
  generationJob?: {
    id: number;
    status: string;
    estimatedCompletion: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  const client = await pool.connect();
  
  try {
    // TODO: Add proper authentication later - for now using mock user
    const userId = 'mock-user-id';
    
    // Parse request body
    const body: GenerateRequest = await request.json();
    
    // Validate request
    const validationResult = validateGenerateRequest(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // Check user credits
    const creditsResult = await client.query(
      'SELECT credits FROM credits WHERE user_id = $1',
      [userId]
    );
    
    const credits = creditsResult.rows[0];
    const requiredCredits = calculateRequiredCredits(body.count || 16);
    
    if (!credits || credits.credits < requiredCredits) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits?.credits || 0}` },
        { status: 402 }
      );
    }

    // Create generation job record
    const jobResult = await client.query(
      `INSERT INTO generation_jobs (user_id, name, type, status, model_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, status, created_at`,
      [
        userId,
        `ProfilePerfect Headshots - ${body.stylePreset}`,
        'profileperfect-generation',
        'processing',
        `job_${Date.now()}_${userId.slice(0, 8)}`
      ]
    );

    const generationJob = jobResult.rows[0];

    // Store uploaded reference photos
    for (const imageUrl of body.referenceImages) {
      await client.query(
        `INSERT INTO uploaded_photos (model_id, uri, created_at) VALUES ($1, $2, NOW())`,
        [generationJob.id, imageUrl]
      );
    }

    // Deduct credits
    await client.query(
      'UPDATE credits SET credits = credits - $1 WHERE user_id = $2',
      [requiredCredits, userId]
    );

    // Start AI generation in background
    startGenerationProcess(generationJob.id, body, userId);

    // Return immediate response
    return NextResponse.json({
      success: true,
      generationJob: {
        id: generationJob.id,
        status: generationJob.status,
        estimatedCompletion: new Date(Date.now() + 120000).toISOString(), // 2 minutes
      },
    });

  } catch (error) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status and images
    const jobResult = await client.query(
      'SELECT * FROM generation_jobs WHERE id = $1',
      [parseInt(jobId)]
    );

    if (jobResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobResult.rows[0];

    // Get generated images
    const imagesResult = await client.query(
      'SELECT * FROM images WHERE model_id = $1 ORDER BY created_at DESC',
      [job.id]
    );

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        images: imagesResult.rows,
      },
    });

  } catch (error) {
    console.error('Error in /api/generate GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * Validate the generation request
 */
function validateGenerateRequest(body: GenerateRequest): { isValid: boolean; error?: string } {
  if (!body.referenceImages || !Array.isArray(body.referenceImages)) {
    return { isValid: false, error: 'Reference images are required' };
  }

  if (body.referenceImages.length < 5 || body.referenceImages.length > 10) {
    return { isValid: false, error: 'Must provide 5-10 reference images' };
  }

  if (!body.stylePreset || typeof body.stylePreset !== 'string') {
    return { isValid: false, error: 'Style preset is required' };
  }

  if (!body.backgroundPreset || typeof body.backgroundPreset !== 'string') {
    return { isValid: false, error: 'Background preset is required' };
  }

  if (body.count && (body.count < 1 || body.count > 32)) {
    return { isValid: false, error: 'Count must be between 1 and 32' };
  }

  if (body.size && !['1024x1024', '1024x1536', '1536x1024'].includes(body.size)) {
    return { isValid: false, error: 'Invalid size specified' };
  }

  if (body.quality && !['standard', 'high'].includes(body.quality)) {
    return { isValid: false, error: 'Invalid quality specified' };
  }

  return { isValid: true };
}

/**
 * Calculate required credits based on generation parameters
 */
function calculateRequiredCredits(count: number): number {
  // Base cost: 1 credit per 4 images
  return Math.ceil(count / 4);
}

/**
 * Start the AI generation process in background
 */
async function startGenerationProcess(jobId: number, request: GenerateRequest, userId: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log(`Starting generation process for job ${jobId}`);
    
    // Update job status to 'generating'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['generating', jobId]
    );

    // Generate headshots using AI abstraction layer
    const generationRequest: GenerationRequest = {
      referenceImages: request.referenceImages,
      stylePreset: request.stylePreset,
      backgroundPreset: request.backgroundPreset,
      count: request.count || 16,
      size: request.size || '1024x1024',
      quality: request.quality || 'high',
    };

    const generatedImages = await generateHeadshots(generationRequest);

    // Store generated images in database
    for (const image of generatedImages) {
      await client.query(
        `INSERT INTO images (model_id, url, is_favorited, style_preset, background_preset, source, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          jobId,
          image.url,
          false,
          request.stylePreset,
          request.backgroundPreset,
          'profileperfect-ai'
        ]
      );
    }

    // Update job status to 'completed'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['completed', jobId]
    );

    console.log(`Generation completed for job ${jobId} with ${generatedImages.length} images`);

  } catch (error) {
    console.error('Error in generation process:', error);

    // Update job status to 'failed'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['failed', jobId]
    );
  } finally {
    client.release();
  }
}
