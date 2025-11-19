import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Azure OpenAI availability (shared-openai-eastus2)
const hasAzureOpenAI = !!(
  process.env.AZURE_OPENAI_ENDPOINT &&
  process.env.AZURE_OPENAI_API_KEY &&
  process.env.AZURE_OPENAI_API_VERSION
);

// Configuration for ProfilePerfect AI APIs - conditional initialization
let openai: OpenAI | null = null;
let genAI: GoogleGenerativeAI | null = null;

try {
  if (hasAzureOpenAI) {
    openai = new OpenAI({
      // apiKey is unused for Azure mode, real key is in defaultHeaders
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY!,
      },
    });
  }

  if (process.env.GOOGLE_NANO_BANANA_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_NANO_BANANA_API_KEY);
  }
} catch (error) {
  console.warn('AI services initialization failed:', error);
}

// Export AI availability status for UI components (generation only)
export const isAIEnabled = !!openai;

// Types for ProfilePerfect AI image operations
export interface GenerationRequest {
  referenceImages: string[]; // Base64 encoded images
  stylePreset: string;
  backgroundPreset: string;
  count?: number; // Default: 16
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'standard' | 'high';
}

export interface RetouchRequest {
  sourceImage: string; // Base64 encoded image
  editType: 'retouch' | 'background' | 'both';
  intensity: number; // 0.1 to 1.0
  backgroundPrompt?: string;
  preserveIdentity: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  base64?: string;
  metadata: {
    model: string;
    prompt: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface RetouchedImage {
  id: string;
  url: string;
  base64?: string;
  metadata: {
    originalImageId: string;
    editType: string;
    intensity: number;
    processingTime: number;
  };
}

/**
 * Generate professional headshots using a two-step flow:
 * 1) GPT-5.1-mini (vision) to derive a biometric identity description.
 * 2) gpt-image-1-mini (Azure OpenAI image deployment) to render headshots.
 *
 * Transforms 5-10 reference photos into 16-32 professional headshots.
 */
export async function generateHeadshots(request: GenerationRequest): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  
  // Demo mode - return mock results when AI services are not available
  if (!openai) {
    console.log('Demo mode: Returning mock headshots');
    const mockImages: GeneratedImage[] = [];
    
    for (let i = 0; i < (request.count || 4); i++) {
      mockImages.push({
        id: `demo-headshot-${i + 1}`,
        url: `https://stmahumsharedapps.blob.core.windows.net/profileperfect-generated/demo-headshot-${i + 1}.jpg`,
        metadata: {
          model: 'demo-model',
          prompt: `Demo ${request.stylePreset} headshot`,
          timestamp: new Date().toISOString(),
          processingTime: 2000 + Math.random() * 3000,
        },
      });
    }
    
    return mockImages;
  }
  
  try {
    // Validate input
    if (!request.referenceImages || request.referenceImages.length < 1) {
      throw new Error('At least one reference image is required');
    }
    if (request.referenceImages.length > 10) {
      throw new Error('Must provide at most 10 reference images');
    }

    // 1) Analyze identity using GPT-5.1-mini (vision)
    const identityDescription = await analyzeIdentity(request.referenceImages);

    // 2) Create comprehensive generation prompt from identity + style
    const prompt = createGenerationPrompt(
      identityDescription,
      request.stylePreset,
      request.backgroundPreset
    );
    
    // 3) Generate images using gpt-image-1-mini
    const response = await openai.images.generate({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_IMAGE || 'gpt-image-1-mini',
      prompt,
      n: request.count || 16,
      size: request.size || '1024x1024',
      quality: request.quality || 'high',
      // Note: gpt-image-1 supports reference images for identity preservation
      // This would be implemented according to the specific API documentation
    });

    const processingTime = Date.now() - startTime;
    
    // Convert response to GeneratedImage format
    if (!response.data) {
      throw new Error('No images generated from API');
    }

    const generatedImages: GeneratedImage[] = response.data.map((image, index) => ({
      id: `generated_${Date.now()}_${index}`,
      url: image.url!,
      metadata: {
        model: 'gpt-image-1',
        prompt: prompt,
        timestamp: new Date().toISOString(),
        processingTime: processingTime / 1000,
      },
    }));

    return generatedImages;

  } catch (error) {
    console.error('Error generating headshots:', error);
    throw new Error(`Failed to generate headshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retouch and enhance images using Google Nano Banana (Gemini 2.5 Flash Image)
 * Provides identity-preserving retouching with intensity control
 */
export async function retouchImage(request: RetouchRequest): Promise<RetouchedImage> {
  const startTime = Date.now();
  
  // Demo mode - return mock result when AI services are not available
  if (!genAI) {
    console.log('Demo mode: Returning mock retouched image');
    return {
      id: 'demo-retouched-image',
      url: `https://stmahumsharedapps.blob.core.windows.net/profileperfect-generated/demo-retouched-${request.editType}.jpg`,
      metadata: {
        originalImageId: 'demo-original',
        editType: request.editType,
        intensity: request.intensity,
        processingTime: 1500 + Math.random() * 2000,
      },
    };
  }
  
  try {
    // Validate input
    if (!request.sourceImage) {
      throw new Error('Source image is required');
    }

    if (request.intensity < 0.1 || request.intensity > 1.0) {
      throw new Error('Intensity must be between 0.1 and 1.0');
    }

    // Get the Nano Banana model
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    
    // Create retouching prompt based on edit type and intensity
    const prompt = createRetouchPrompt(request.editType, request.intensity, request.backgroundPrompt);
    
    // Prepare image data for Nano Banana
    const imageData = {
      inlineData: {
        data: request.sourceImage,
        mimeType: 'image/jpeg',
      },
    };

    // Generate retouched image using Nano Banana
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    
    const processingTime = Date.now() - startTime;
    
    // Extract the retouched image (implementation depends on Nano Banana API response format)
    const retouchedImage: RetouchedImage = {
      id: `retouched_${Date.now()}`,
      url: response.text(), // This would be the actual image URL or base64 data
      metadata: {
        originalImageId: 'original_' + Date.now(),
        editType: request.editType,
        intensity: request.intensity,
        processingTime: processingTime / 1000,
      },
    };

    return retouchedImage;

  } catch (error) {
    console.error('Error retouching image:', error);
    throw new Error(`Failed to retouch image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze a person's identity using GPT-5.1-mini with vision input.
 * Accepts reference image URLs (or base64 data URLs) and returns a textual
 * biometric description focusing on permanent physical traits.
 */
async function analyzeIdentity(referenceImages: string[]): Promise<string> {
  if (!openai) {
    throw new Error('Azure OpenAI client is not configured');
  }

  const chatModel = process.env.AZURE_OPENAI_DEPLOYMENT_CHAT || 'gpt-5.1-mini';
  const maxImages = Math.min(referenceImages.length, 4);

  const imageBlocks = referenceImages.slice(0, maxImages).map((url) => ({
    // OpenAI vision input; Azure respects the same schema via baseURL
    type: 'image_url',
    image_url: { url },
  })) as any;

  const analysisPrompt = `You are a biometric expert and professional photographer. Analyze the person in these images carefully.
Output a detailed physical description focusing ONLY on permanent physical traits to recreate this person's likeness.

Describe in detail:
- Exact face shape (jawline, chin structure, cheekbones).
- Eyes (color, shape, eyelids, eyebrow thickness/shape).
- Nose (bridge width, tip shape).
- Mouth (lip fullness, shape).
- Hair (color, texture, hairline, length, parting).
- Skin tone (complexion, undertones).
- Age range.
- Distinctive features (freckles, moles, dimples, scars).

Do NOT describe current clothing, expression, or background.`;

  const messages: any = [
    {
      role: 'system',
      content:
        'You are a careful biometric analyst focused on permanent physical traits for photo likeness.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: analysisPrompt },
        ...imageBlocks,
      ],
    },
  ];

  const completion = await openai.chat.completions.create({
    model: chatModel,
    messages,
  } as any);

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Identity analysis returned no content');
  }

  return typeof content === 'string' ? content.trim() : JSON.stringify(content);
}

/**
 * Create comprehensive generation prompt for gpt-image-1-mini
 * using the biometric identity description plus style/background.
 */
function createGenerationPrompt(
  identityDescription: string,
  stylePreset: string,
  backgroundPreset: string
): string {
  return `A high-end professional headshot of a person matching this description:
${identityDescription}

SETTINGS:
- Style: ${stylePreset}
- Background: ${backgroundPreset}
- Camera: 85mm portrait lens, f/1.8 aperture
- Lighting: Cinematic studio lighting, soft fill, with subtle rim light
- Pose: Shoulders angled slightly, face forward, confident but approachable
- Quality: 4K, photorealistic, natural skin texture, no plastic skin.`;
}

/**
 * Create retouching prompt for Nano Banana based on edit type and intensity
 */
function createRetouchPrompt(editType: string, intensity: number, backgroundPrompt?: string): string {
  const intensityDescriptor = intensity < 0.3 ? 'subtle' : intensity < 0.7 ? 'moderate' : 'strong';
  
  let basePrompt = `Enhance this portrait with ${intensityDescriptor} professional retouching while preserving the person's natural identity and appearance.`;
  
  if (editType === 'background' && backgroundPrompt) {
    basePrompt += ` Replace the background with: ${backgroundPrompt}.`;
  }
  
  if (editType === 'retouch') {
    basePrompt += ` Improve lighting, skin smoothing, and overall professional appearance.`;
  }
  
  if (editType === 'both') {
    basePrompt += ` Improve lighting, skin smoothing, and replace background with professional setting.`;
  }
  
  return basePrompt;
}

/**
 * Get available style presets for headshot generation
 */
export function getAvailableStylePresets(): string[] {
  return [
    'Corporate Executive',
    'Tech Startup Professional', 
    'Creative Industry',
    'Healthcare Professional',
    'Legal Professional',
    'Academic Researcher',
    'Sales Professional',
    'Consultant',
    'Financial Services',
    'Marketing Professional'
  ];
}

/**
 * Get available background presets for headshot generation
 */
export function getAvailableBackgroundPresets(): string[] {
  return [
    'Modern office with blurred background',
    'Professional studio lighting',
    'Corporate boardroom',
    'Minimalist gray background',
    'Blue gradient professional',
    'Warm wood office setting',
    'Technology innovation center',
    'Library or academic setting',
    'Medical office environment',
    'Creative studio space'
  ];
}
