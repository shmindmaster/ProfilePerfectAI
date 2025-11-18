import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateHeadshots, GenerationRequest } from '@/lib/ai/image-generation';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase service client for background operations
const supabaseService = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { data: credits } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const requiredCredits = calculateRequiredCredits(body.count || 16);
    
    if (!credits || credits.credits < requiredCredits) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Required: ${requiredCredits}, Available: ${credits?.credits || 0}` },
        { status: 402 }
      );
    }

    // Create generation job record
    const { data: generationJob, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        name: `ProfilePerfect Headshots - ${body.stylePreset}`,
        type: 'profileperfect-generation',
        status: 'processing',
        modelId: `job_${Date.now()}_${user.id.slice(0, 8)}`,
      })
      .select()
      .single();

    if (jobError || !generationJob) {
      console.error('Error creating generation job:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create generation job' },
        { status: 500 }
      );
    }

    // Store uploaded reference photos
    const uploadedPhotos = [];
    for (let i = 0; i < body.referenceImages.length; i++) {
      const { data: photo, error: photoError } = await supabase
        .from('uploaded_photos')
        .insert({
          modelId: generationJob.id,
          uri: body.referenceImages[i],
        })
        .select()
        .single();

      if (photoError) {
        console.error('Error storing reference photo:', photoError);
      } else {
        uploadedPhotos.push(photo);
      }
    }

    // Deduct credits
    const { error: creditError } = await supabase
      .from('credits')
      .update({ credits: credits.credits - requiredCredits })
      .eq('user_id', user.id);

    if (creditError) {
      console.error('Error deducting credits:', creditError);
    }

    // Start AI generation in background
    startGenerationProcess(generationJob.id, body, user.id);

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
  try {
    console.log(`Starting generation process for job ${jobId}`);
    
    // Update job status to 'generating' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ status: 'generating' })
      .eq('id', jobId);

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

    // Store generated images in database using service client
    const storedImages = [];
    for (const image of generatedImages) {
      const { data: storedImage, error: storeError } = await supabaseService
        .from('images')
        .insert({
          modelId: jobId,
          uri: image.url,
          style_preset: request.stylePreset,
          background_preset: request.backgroundPreset,
          source: 'generated',
        })
        .select()
        .single();

      if (storeError) {
        console.error('Error storing generated image:', storeError);
      } else {
        storedImages.push(storedImage);
      }
    }

    // Update job status to 'completed' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ 
        status: 'completed',
        name: `ProfilePerfect Headshots - ${request.stylePreset} (${storedImages.length} images)`
      })
      .eq('id', jobId);

    console.log(`Generation completed for job ${jobId}. Generated ${storedImages.length} images.`);

  } catch (error) {
    console.error(`Generation failed for job ${jobId}:`, error);
    
    // Update job status to 'failed' using service client
    await supabaseService
      .from('generation_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId);
  }
}

/**
 * GET endpoint to check generation status
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

    // Get job details with generated images
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
    console.error('Error in /api/generate GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
