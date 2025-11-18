import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';
import { retouchImage, RetouchRequest } from '@/lib/ai/image-generation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
});

interface RetouchApiRequest {
  sourceImageId: number;
  editType: 'retouch' | 'background' | 'both';
  intensity: number;
  backgroundPrompt?: string;
  preserveIdentity: boolean;
}

interface RetouchApiResponse {
  success: boolean;
  retouchJob?: {
    id: number;
    parentImageId: number;
    status: string;
    estimatedCompletion: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RetouchApiResponse>> {
  const client = await pool.connect();
  
  try {
    // TODO: Add proper authentication later - for now using mock user
    const userId = 'mock-user-id';
    
    // Parse request body
    const body: RetouchApiRequest = await request.json();
    
    // Validate request
    const validationResult = validateRetouchRequest(body);
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
    const requiredCredits = calculateRequiredCredits(body.editType);
    
    if (!credits || credits.credits < requiredCredits) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits?.credits || 0}` },
        { status: 402 }
      );
    }

    // Verify source image exists and belongs to user
    const imageResult = await client.query(
      `SELECT i.* FROM images i 
       JOIN generation_jobs gj ON i.model_id = gj.id 
       WHERE i.id = $1 AND gj.user_id = $2`,
      [body.sourceImageId, userId]
    );

    if (imageResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source image not found' },
        { status: 404 }
      );
    }

    // Create retouch job record
    const jobResult = await client.query(
      `INSERT INTO generation_jobs (user_id, name, type, status, model_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, status, created_at`,
      [
        userId,
        `ProfilePerfect Retouch - ${body.editType}`,
        'profileperfect-retouch',
        'processing',
        `retouch_${Date.now()}_${userId.slice(0, 8)}`
      ]
    );

    const retouchJob = jobResult.rows[0];

    // Deduct credits
    await client.query(
      'UPDATE credits SET credits = credits - $1 WHERE user_id = $2',
      [requiredCredits, userId]
    );

    // Start retouch process in background
    startRetouchProcess(retouchJob.id, body, userId);

    // Return immediate response
    return NextResponse.json({
      success: true,
      retouchJob: {
        id: retouchJob.id,
        parentImageId: body.sourceImageId,
        status: retouchJob.status,
        estimatedCompletion: new Date(Date.now() + 60000).toISOString(), // 1 minute
      },
    });

  } catch (error) {
    console.error('Error in /api/retouch:', error);
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

    // Get job status and retouched images
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

    // Get retouched images
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
    console.error('Error in /api/retouch GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * Validate the retouch request
 */
function validateRetouchRequest(body: RetouchApiRequest): { isValid: boolean; error?: string } {
  if (!body.sourceImageId || typeof body.sourceImageId !== 'number') {
    return { isValid: false, error: 'Source image ID is required' };
  }

  if (!body.editType || !['retouch', 'background', 'both'].includes(body.editType)) {
    return { isValid: false, error: 'Edit type must be retouch, background, or both' };
  }

  if (typeof body.intensity !== 'number' || body.intensity < 1 || body.intensity > 10) {
    return { isValid: false, error: 'Intensity must be a number between 1 and 10' };
  }

  if (body.editType === 'background' && !body.backgroundPrompt) {
    return { isValid: false, error: 'Background prompt is required for background edits' };
  }

  if (typeof body.preserveIdentity !== 'boolean') {
    return { isValid: false, error: 'Preserve identity must be true or false' };
  }

  return { isValid: true };
}

/**
 * Calculate required credits based on retouch parameters
 */
function calculateRequiredCredits(editType: string): number {
  switch (editType) {
    case 'retouch':
      return 2;
    case 'background':
      return 3;
    case 'both':
      return 4;
    default:
      return 2;
  }
}

/**
 * Start the retouch process in background
 */
async function startRetouchProcess(jobId: number, request: RetouchApiRequest, userId: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log(`Starting retouch process for job ${jobId}`);
    
    // Update job status to 'generating'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['generating', jobId]
    );

    // Get source image
    const sourceImageResult = await client.query(
      'SELECT url FROM images WHERE id = $1',
      [request.sourceImageId]
    );

    const sourceImage = sourceImageResult.rows[0];
    if (!sourceImage) {
      throw new Error('Source image not found');
    }

    // Generate retouch request
    const retouchRequest: RetouchRequest = {
      sourceImage: sourceImage.url,
      editType: request.editType,
      intensity: request.intensity,
      backgroundPrompt: request.backgroundPrompt,
      preserveIdentity: request.preserveIdentity,
    };

    const retouchedImages = await retouchImage(retouchRequest);

    // Store retouched images in database
    const images = Array.isArray(retouchedImages) ? retouchedImages : [retouchedImages];
    for (const image of images) {
      await client.query(
        `INSERT INTO images (model_id, url, is_favorited, style_preset, background_preset, source, parent_image_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          jobId,
          image.url,
          false,
          'retouched',
          request.editType,
          'profileperfect-ai',
          request.sourceImageId
        ]
      );
    }

    // Update job status to 'completed'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['completed', jobId]
    );

    console.log(`Retouch completed for job ${jobId} with ${images.length} images`);

  } catch (error) {
    console.error('Error in retouch process:', error);
    
    // Update job status to 'failed'
    await client.query(
      'UPDATE generation_jobs SET status = $1 WHERE id = $2',
      ['failed', jobId]
    );
  } finally {
    client.release();
  }
}
