/**
 * Mock data for E2E tests
 */

export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockGenerationJob = {
  id: 1,
  user_id: mockUser.id,
  name: 'Test Generation',
  status: 'completed',
  type: 'man',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockUploadedPhotos = [
  {
    id: 1,
    model_id: mockGenerationJob.id,
    uri: '/test-images/sample1.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    model_id: mockGenerationJob.id,
    uri: '/test-images/sample2.jpg',
    created_at: new Date().toISOString(),
  },
];

export const mockGeneratedImages = [
  {
    id: '1',
    url: '/test-images/generated1.jpg',
    is_favorited: false,
    style_preset: 'corporate',
    background_preset: 'office',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    url: '/test-images/generated2.jpg',
    is_favorited: true,
    style_preset: 'creative',
    background_preset: 'studio',
    created_at: new Date().toISOString(),
  },
];

export const mockAPIResponses = {
  uploadSuccess: {
    success: true,
    message: 'Images uploaded successfully',
    uploadedPhotos: mockUploadedPhotos,
  },
  
  uploadError: {
    success: false,
    error: 'Upload failed',
    message: 'Failed to upload images',
  },
  
  generateSuccess: {
    success: true,
    jobId: mockGenerationJob.id,
    estimatedTime: '5 minutes',
  },
  
  generateError: {
    success: false,
    error: 'Generation failed',
    message: 'Insufficient credits or server error',
  },
  
  jobStatus: {
    id: mockGenerationJob.id,
    status: 'processing',
    progress: 50,
    estimatedCompletion: new Date(Date.now() + 5 * 60000).toISOString(),
  },
  
  jobComplete: {
    id: mockGenerationJob.id,
    status: 'completed',
    progress: 100,
    images: mockGeneratedImages,
  },
};

export const stylePresets = [
  { value: 'corporate', label: 'Corporate Professional' },
  { value: 'creative', label: 'Creative & Artistic' },
  { value: 'casual', label: 'Casual Professional' },
  { value: 'executive', label: 'Executive Leadership' },
];

export const backgroundPresets = [
  { value: 'office', label: 'Modern Office' },
  { value: 'studio', label: 'Studio Background' },
  { value: 'outdoor', label: 'Outdoor Setting' },
  { value: 'solid', label: 'Solid Color' },
];

/**
 * Test error scenarios
 */
export const errorScenarios = {
  networkTimeout: {
    name: 'Network Timeout',
    error: 'ETIMEDOUT',
    message: 'Request timed out. Please try again.',
  },
  
  serverError: {
    name: 'Server Error',
    status: 500,
    error: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.',
  },
  
  unauthorized: {
    name: 'Unauthorized',
    status: 401,
    error: 'Unauthorized',
    message: 'Please log in to continue.',
  },
  
  rateLimited: {
    name: 'Rate Limited',
    status: 429,
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  
  invalidInput: {
    name: 'Invalid Input',
    status: 400,
    error: 'Bad Request',
    message: 'Invalid input data. Please check your input and try again.',
  },
};

/**
 * Test file information
 */
export const testFiles = {
  validImage: {
    name: 'test-sample.jpg',
    path: 'public/test-sample.jpg',
    size: 50000, // ~50KB
    type: 'image/jpeg',
  },
  
  largeImage: {
    name: 'large-image.jpg',
    size: 5 * 1024 * 1024, // 5MB
    type: 'image/jpeg',
  },
  
  invalidType: {
    name: 'document.pdf',
    size: 10000,
    type: 'application/pdf',
  },
  
  tooManyFiles: Array.from({ length: 11 }, (_, i) => ({
    name: `image${i + 1}.jpg`,
    size: 100000,
    type: 'image/jpeg',
  })),
};

/**
 * Validation messages
 */
export const validationMessages = {
  emailRequired: 'Email is required',
  emailInvalid: 'Invalid email address',
  nameRequired: 'Name is required',
  nameTooLong: 'Name too long',
  imagesRequired: 'Please upload images',
  tooManyImages: 'You can only upload up to 10 images',
  imagesTooLarge: 'The total combined size of the images cannot exceed 4.5MB',
  invalidFileType: 'Please upload only image files (JPEG, PNG)',
  styleRequired: 'Style preset is required',
  backgroundRequired: 'Background preset is required',
};

/**
 * Success messages
 */
export const successMessages = {
  uploadComplete: 'Images uploaded successfully',
  generationStarted: 'Generation started',
  imageFavorited: 'Image favorited',
  imageDownloaded: 'Download started',
  loginSuccess: 'Welcome back!',
  demoActivated: 'Demo Mode Activated!',
};

/**
 * Feature flags for testing different states
 */
export const featureFlags = {
  stripeEnabled: process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === 'true',
  demoMode: true,
  maintenanceMode: false,
};
