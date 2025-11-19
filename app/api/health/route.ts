import { NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";
import { BlobServiceClient } from "@azure/storage-blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.AZURE_POSTGRES_URL,
});

function getAzureOpenAIClient() {
  if (
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_OPENAI_API_KEY ||
    !process.env.AZURE_OPENAI_DEPLOYMENT_CHAT
  ) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    baseURL: process.env.AZURE_OPENAI_ENDPOINT!,
    defaultQuery: {
      "api-version": process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
    },
  });
}

export async function GET() {
  const db = { ok: false, error: null as string | null };
  const openai = { ok: false, error: null as string | null };
  const storage = { ok: false, error: null as string | null };

  // DB health check
  try {
    const client = await dbPool.connect();
    try {
      await client.query("SELECT 1 as ok");
      db.ok = true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    db.error = err?.message || "Unknown database error";
  }

  // Azure OpenAI health check
  try {
    const client = getAzureOpenAIClient();
    if (!client) {
      openai.error = "Azure OpenAI env vars are not fully configured";
    } else {
      await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_CHAT!,
        max_tokens: 5,
        messages: [
          {
            role: "user",
            content: "Health check ping",
          },
        ],
      } as any);
      openai.ok = true;
    }
  } catch (err: any) {
    openai.error = err?.message || "Unknown Azure OpenAI error";
  }

  // Azure Storage health check
  try {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      storage.error = "AZURE_STORAGE_CONNECTION_STRING is not set";
    } else {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING,
      );
      const uploadsContainerName =
        process.env.APP_BLOB_CONTAINER_UPLOADS || "profileperfect-uploads";
      const generatedContainerName =
        process.env.APP_BLOB_CONTAINER_GENERATED || "profileperfect-generated";

      const uploadsExists = await blobServiceClient
        .getContainerClient(uploadsContainerName)
        .exists();
      const generatedExists = await blobServiceClient
        .getContainerClient(generatedContainerName)
        .exists();

      if (uploadsExists && generatedExists) {
        storage.ok = true;
      } else {
        storage.error = `One or more containers missing: uploads=${uploadsExists}, generated=${generatedExists}`;
      }
    }
  } catch (err: any) {
    storage.error = err?.message || "Unknown Azure Storage error";
  }

  const ok = db.ok && openai.ok && storage.ok;

  return NextResponse.json(
    {
      ok,
      db,
      openai,
      storage,
    },
    { status: ok ? 200 : 500 },
  );
}
