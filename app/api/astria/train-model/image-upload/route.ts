import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UploadRequest {
  filename: string;
  file: string; // base64 data
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadRequest = await request.json();
    
    if (!body.filename || !body.file) {
      return NextResponse.json({ error: 'Filename and file data are required' }, { status: 400 });
    }

    // For demo mode, create a mock blob URL
    // In production, this would upload to Azure Storage
    const mockBlobUrl = `https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/demo-${Date.now()}-${body.filename}`;
    
    return NextResponse.json({
      url: mockBlobUrl,
      name: body.filename,
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
