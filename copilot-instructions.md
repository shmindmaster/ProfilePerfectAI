# Copilot Instructions – ProfilePerfectAI

## Repo Role

ProfilePerfectAI is a **Next.js 14 headshot generation and retouching app** that has been refit onto the MahumTech Azure stack:

- Next.js 14 app router frontend (no API routes in a separate backend service – all HTTP is via `app/api`).
- AI image generation via **Azure OpenAI** (`gpt-image-1`) using the `OpenAI` SDK with `baseURL` + `api-key` headers.
- Optional retouching via **Google Generative AI (Nano Banana / `gemini-2.5-flash-image`)**.
- Uploads and assets stored in **Azure Blob Storage**, not Vercel Blob.
- Headshot jobs, credits, and images stored in **Azure PostgreSQL** via `pg`.

Treat this as a full-stack Azure-aligned AI demo, not as the original generic headshots-starter.

## Tech Stack (from code, not README)

- **Framework**: Next.js 14 (`app/`), React 18, TypeScript.
- **Styling**: Tailwind CSS 3.3.x + shadcn/ui + Radix UI.
- **AI**:
  - `lib/ai/image-generation.ts` – Azure OpenAI (`gpt-image-1`) for generation, Google GenAI for retouch.
- **Storage**:
  - `lib/azure-storage.ts` – `@azure/storage-blob` with `AZURE_STORAGE_CONNECTION_STRING` + `AZURE_STORAGE_CONTAINER` (`profileperfect-ai` by default).
- **Database**:
  - `app/api/generate/route.ts` and `app/api/test-db/route.ts` – `pg.Pool` using `AZURE_POSTGRES_URL`.

## Local Development

From `ProfilePerfectAI/`:

```bash
pnpm install
pnpm dev      # next dev (port 3000)

pnpm build    # next build
pnpm start    # next start

pnpm test:e2e       # Playwright tests (see package.json)
pnpm test:e2e:ui    # UI mode
pnpm test:e2e:mobile
pnpm test:e2e:desktop
```

Copy envs from the template and adapt for Azure:

```bash
cp .env.example .env.local
# Then set:
# AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION
# GOOGLE_NANO_BANANA_API_KEY (optional retouch)
# AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER
# AZURE_POSTGRES_URL
```

## AI Integration – How It Really Works

### Azure OpenAI client

`lib/ai/image-generation.ts` wires the `OpenAI` client like this:

```ts
openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});
```

This means:

- Calls are **actually going to Azure OpenAI**, not openai.com.
- `OPENAI_API_KEY` is effectively unused in Azure mode; `AZURE_OPENAI_API_KEY` is the real credential.

`generateHeadshots` then calls:

```ts
const response = await openai.images.generate({
  model: 'gpt-image-1',
  prompt,
  n: count,
  size,
  quality,
});
```

In demo mode (no keys), it returns fixed URLs from `stmahumsharedapps.blob.core.windows.net/profileperfect-ai/...`.

### Retouching

`retouchImage` uses `GoogleGenerativeAI` with `gemini-2.5-flash-image` and is currently **non-Azure**. Treat this as transitional:

- Do **not** proliferate Nano Banana usage to other repos.
- If you add Azure-native retouching later, keep the `retouchImage` signature stable and swap internals.

## Storage – Azure Blob Only

`lib/azure-storage.ts` replaces Vercel Blob:

- Container is created on demand (`createIfNotExists({ access: 'blob' })`).
- Uploads use `BlockBlobClient.upload(...)`.

`app/api/upload/route.ts`:

- Accepts `filename` + `file` (base64 data URL) in JSON body.
- Uses `generateUniqueFilename` and `uploadToAzureStorage`.

On the client, use `lib/upload-client.ts`:

```ts
await upload(file.name, file, {
  handleUploadUrl: '/api/upload',
});
```

Do **not** reintroduce Vercel Blob or direct browser uploads to Azure Blob – always go through this API route.

## Database – Azure Postgres via pg

`app/api/generate/route.ts` uses:

```ts
const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRES_URL,
});
```

It:

- Checks `credits` table for `user_id` (currently a mock user).
- Creates a row in `generation_jobs`.
- Inserts reference image URLs into `uploaded_photos`.
- Deducts credits.
- Calls `startGenerationProcess` to generate images with `generateHeadshots` and insert into `images`.

If you add fields or tables, keep these patterns:

- Always use parameterized SQL (`$1`, `$2`, ...).
- Reuse the existing pool – do not create per-request connections.

## What Copilot Should Do

- **Read the code first** (`lib/ai/image-generation.ts`, `lib/azure-storage.ts`, `app/api/*`) before trusting README content.
- When modifying AI behavior, change the abstraction layer functions (`generateHeadshots`, `retouchImage`) rather than sprinkling OpenAI calls around.
- Keep everything Azure-aligned: Azure OpenAI, Azure Storage, Azure Postgres.
- Maintain demo-mode behavior so the app runs without secrets in local dev.

## What Copilot Should Not Do

- Do **not** add direct calls to OpenAI public endpoints from browser or server.
- Do **not** swap Azure Storage back to Vercel Blob or any other provider in this repo.
- Do **not** bypass credits or job tracking when adding new generation flows.
- Do **not** introduce a completely separate backend framework here – API routes and `pg` are the intended pattern.
