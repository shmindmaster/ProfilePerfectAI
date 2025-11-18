import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { put } from '@vercel/blob';

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

    // Handle the upload using Vercel Blob
    const blob = await put(body.filename, body.file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ message: 'Upload endpoint is ready' });
}
