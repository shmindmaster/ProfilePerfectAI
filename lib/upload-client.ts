/**
 * Client-side upload utility for Azure Storage
 * Replaces @vercel/blob client functionality
 */

export interface UploadResult {
  url: string;
  name: string;
  uploadedAt: string;
}

export interface UploadOptions {
  access?: 'public';
  handleUploadUrl: string;
}

/**
 * Upload a file to Azure Storage via API endpoint
 * Mimics the @vercel/blob client upload function interface
 */
export async function upload(
  filename: string,
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Convert File to base64
    const base64 = await fileToBase64(file);
    
    // Call the upload API endpoint
    const response = await fetch(options.handleUploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        file: base64,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Convert a File object to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
