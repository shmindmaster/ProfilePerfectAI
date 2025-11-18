import { NextRequest, NextResponse } from 'next/server';
import { uploadToAzureStorage, generateUniqueFilename } from '@/lib/azure-storage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.filename || !body.file) {
      return NextResponse.json(
        { error: 'Filename and file data are required' },
        { status: 400 }
      );
    }

    // Generate unique filename to avoid conflicts
    const uniqueFilename = generateUniqueFilename(body.filename);

    // Convert base64 file data to buffer
    const buffer = Buffer.from(body.file.split(',')[1], 'base64');

    // Upload to Azure Storage
    const result = await uploadToAzureStorage(uniqueFilename, buffer);

    return NextResponse.json({
      url: result.url,
      name: result.name,
      uploadedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ 
    message: 'Azure Storage upload endpoint is ready',
    provider: 'Azure Storage',
    container: process.env.AZURE_STORAGE_CONTAINER || 'profileperfect-ai'
  });
}
