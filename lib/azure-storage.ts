import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

// Azure Storage configuration (shared stmahumsharedapps)
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

// For uploads we use the app-specific uploads container by default
const containerName =
  process.env.APP_BLOB_CONTAINER_UPLOADS ||
  process.env.AZURE_STORAGE_CONTAINER ||
  'profileperfect-uploads';

/**
 * Upload a file to Azure Storage
 */
export async function uploadToAzureStorage(
  filename: string, 
  file: Buffer | Blob | ArrayBuffer
): Promise<{ url: string; name: string }> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({ access: 'blob' });
    
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    // Upload the file
    let fileSize: number;
    if (file instanceof Buffer) {
      fileSize = file.length;
    } else if (file instanceof Blob) {
      fileSize = file.size;
    } else if (file instanceof ArrayBuffer) {
      fileSize = file.byteLength;
    } else {
      throw new Error('Unsupported file type');
    }

    await blockBlobClient.upload(file, fileSize, {
      blobHTTPHeaders: { blobContentType: 'image/jpeg' },
    });
    
    // Return the public URL
    return {
      url: blockBlobClient.url,
      name: filename,
    };
  } catch (error) {
    console.error('Azure Storage upload error:', error);
    throw new Error(`Failed to upload to Azure Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Azure Storage
 */
export async function deleteFromAzureStorage(filename: string): Promise<void> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    await blockBlobClient.delete();
  } catch (error) {
    console.error('Azure Storage delete error:', error);
    throw new Error(`Failed to delete from Azure Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique filename for uploads
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
}
