import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration for ProfilePerfect AI APIs
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_NANO_BANANA_API_KEY!);

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
 * Generate professional headshots using OpenAI gpt-image-1
 * Transforms 5-10 reference photos into 16-32 professional headshots
 */
export async function generateHeadshots(request: GenerationRequest): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (request.referenceImages.length < 5 || request.referenceImages.length > 10) {
      throw new Error('Must provide 5-10 reference images for optimal results');
    }

    // Create comprehensive prompt from reference images and style
    const prompt = createGenerationPrompt(request.stylePreset, request.backgroundPreset);
    
    // Generate images using gpt-image-1 with reference images
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt,
      n: request.count || 16,
      size: request.size || '1024x1024',
      quality: request.quality || 'high',
      // Note: gpt-image-1 supports reference images for identity preservation
      // This would be implemented according to the specific API documentation
    });

    const processingTime = Date.now() - startTime;
    
    // Convert response to GeneratedImage format
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
  
  try {
    // Validate input
    if (!request.sourceImage) {
      throw new Error('Source image is required');
    }

    if (request.intensity < 0.1 || request.intensity > 1.0) {
      throw new Error('Intensity must be between 0.1 and 1.0');
    }

    // Get the Nano Banana model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    
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
 * Create comprehensive generation prompt for gpt-image-1
 */
function createGenerationPrompt(stylePreset: string, backgroundPreset: string): string {
  return `Professional headshot of a person with their natural appearance preserved, ${stylePreset} style, ${backgroundPreset} background, studio lighting, high resolution, business professional, suitable for LinkedIn profile and company website. The person should look like themselves but enhanced with professional lighting and composition.`;
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
