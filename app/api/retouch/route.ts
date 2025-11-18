import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { retouchImage, RetouchRequest } from '@/lib/ai/image-generation';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase service client for background operations
const supabaseService = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  try {
    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Verify user owns the source image
    const { data: sourceImage, error: imageError } = await supabase
      .from('images')
      .select(`
        *,
        generation_jobs!inner (
          user_id
        )
      `)
      .eq('id', body.sourceImageId)
      .eq('generation_jobs.user_id', user.id)
      .single();

    if (imageError || !sourceImage) {
      return NextResponse.json(
        { success: false, error: 'Source image not found or access denied' },
        { status: 404 }
      );
    }

    // Check user credits
    const { data: credits } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const requiredCredits = calculateRetouchCredits(body.editType);
    
    if (!credits || credits.credits < requiredCredits) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits?.credits || 0}` },
        { status: 402 }
      );
    }

    // Create retouch job record
    const { data: retouchJob, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        name: `ProfilePerfect Retouch - ${body.editType}`,
        type: 'profileperfect-retouch',
        status: 'processing',
        modelId: `retouch_${Date.now()}_${user.id.slice(0, 8)}`,
      })
      .select()
      .single();

    if (jobError || !retouchJob) {
      console.error('Error creating retouch job:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create retouch job' },
        { status: 500 }
      );
    }

    // Deduct credits
    const { error: creditError } = await supabase
      .from('credits')
      .update({ credits: credits.credits - requiredCredits })
      .eq('user_id', user.id);

    if (creditError) {
      console.error('Error deducting credits:', creditError);
    }

    // Start retouching process in background
    startRetouchProcess(retouchJob.id, body, sourceImage, user.id);

    // Return immediate response
    return NextResponse.json({
      success: true,
      retouchJob: {
        id: retouchJob.id,
        parentImageId: body.sourceImageId,
        status: retouchJob.status,
        estimatedCompletion: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      },
    });

  } catch (error) {
    console.error('Error in /api/retouch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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

  if (typeof body.intensity !== 'number' || body.intensity < 0.1 || body.intensity > 1.0) {
    return { isValid: false, error: 'Intensity must be between 0.1 and 1.0' };
  }

  if (body.backgroundPrompt && typeof body.backgroundPrompt !== 'string') {
    return { isValid: false, error: 'Background prompt must be a string' };
  }

  if (typeof body.preserveIdentity !== 'boolean') {
    return { isValid: false, error: 'Preserve identity must be a boolean' };
  }

  return { isValid: true };
}

/**
 * Calculate required credits based on retouch type
 */
function calculateRetouchCredits(editType: string): number {
  switch (editType) {
    case 'retouch':
      return 1; // 1 credit for basic retouching
    case 'background':
      return 1; // 1 credit for background replacement
    case 'both':
      return 2; // 2 credits for both operations
    default:
      return 1;
  }
}

/**
 * Start the AI retouching process in background
 */
async function startRetouchProcess(
  jobId: number, 
  request: RetouchApiRequest, 
  sourceImage: any, 
  userId: string
): Promise<void> {
  try {
    console.log(`Starting retouch process for job ${jobId}`);
    
    // Update job status to 'retouching' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ status: 'retouching' })
      .eq('id', jobId);

    // Create retouch request for AI abstraction layer
    const retouchRequest: RetouchRequest = {
      sourceImage: sourceImage.uri, // This would be base64 encoded image data
      editType: request.editType,
      intensity: request.intensity,
      backgroundPrompt: request.backgroundPrompt,
      preserveIdentity: request.preserveIdentity,
    };

    const retouchedImage = await retouchImage(retouchRequest);

    // Store retouched image in database using service client
    const { data: storedImage, error: storeError } = await supabaseService
      .from('images')
      .insert({
        modelId: jobId,
        uri: retouchedImage.url,
        parent_image_id: sourceImage.id,
        style_preset: sourceImage.style_preset,
        background_preset: request.backgroundPrompt || sourceImage.background_preset,
        source: 'generated',
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing retouched image:', storeError);
      throw storeError;
    }

    // Update job status to 'completed' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ 
        status: 'completed',
        name: `ProfilePerfect Retouch - ${request.editType} (completed)`
      })
      .eq('id', jobId);

    console.log(`Retouch completed for job ${jobId}. Created image ID: ${storedImage.id}`);

  } catch (error) {
    console.error(`Retouch failed for job ${jobId}:`, error);
    
    // Update job status to 'failed' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId);
  }
}

/**
 * GET endpoint to check retouch status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get job ID from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job details with retouched images
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .select(`
        *,
        images (
          id,
          uri,
          is_favorited,
          style_preset,
          background_preset,
          parent_image_id,
          created_at
        )
      `)
      .eq('id', parseInt(jobId))
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        images: job.images || [],
      },
    });

  } catch (error) {
    console.error('Error in /api/retouch GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
