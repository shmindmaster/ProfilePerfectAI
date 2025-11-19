# ProfilePerfectAI Alignment Summary

## Overview

ProfilePerfectAI has been analyzed and updated to align with the unified stack architecture, bringing it in line with Lawli, VoxOps, CampGen, and other applications in the fleet.

## Current Status

### ✅ Already Aligned

1. **Shared Azure Resources**
   - ✅ Azure OpenAI: `shared-openai-eastus2`
   - ✅ Azure Storage: `stmahumsharedapps` (containers: `profileperfect-uploads`, `profileperfect-generated`)
   - ✅ Azure PostgreSQL: `pg-shared-apps-eastus2` with database `profileperfect_db`

2. **Configuration**
   - ✅ Environment variables aligned with CEVS pattern
   - ✅ `.env.example` includes all required variables
   - ✅ No Key Vault dependencies (uses `.env.local`, GitHub secrets, Azure app settings)

3. **Database**
   - ✅ Using Azure PostgreSQL (migrated from Supabase)
   - ✅ Schema defined in `scripts/profileperfect-db.sql`
   - ✅ Setup script: `scripts/setup-azure-db.js`

### ⚠️ Needs Attention

1. **Dependencies**
   - ⚠️ `@google/generative-ai` package present (should be removed or replaced with Azure OpenAI)
   - ⚠️ Some Supabase references in README (code already uses Azure PostgreSQL)

2. **Database Setup**
   - ✅ Updated `setup-azure-db.js` to use environment variables
   - ✅ Password configured: `WalidSahab112025`
   - ⚠️ Database schema may need verification

3. **Model Deployments**
   - ✅ `gpt-5.1-mini` (chat) - may need deployment
   - ✅ `gpt-image-1-mini` (image generation)
   - ✅ `text-embedding-3-small` (embeddings)

## Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API routes (App Router)
- **Database**: Azure PostgreSQL (`profileperfect_db`)
- **Storage**: Azure Blob Storage (`stmahumsharedapps`)
- **AI**: Azure OpenAI (`gpt-image-1-mini` for image generation)
- **Payments**: Stripe
- **Testing**: Playwright (E2E)

### Database Schema

Tables:
- `users` - User accounts
- `credits` - Credit balance per user
- `generation_jobs` - Headshot generation jobs
- `uploaded_photos` - Reference images per job
- `images` - Generated/retouched images

### API Endpoints

- `/api/health` - Health check (tests DB, OpenAI, Storage)
- `/api/generate` - Generate headshots
- `/api/retouch` - Retouch images
- `/api/upload` - Upload photos
- `/api/test-db` - Database connection test
- `/api/astria/train-model` - Astria model training

## Environment Variables

### Required (from `.env.local`)

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://shared-openai-eastus2.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT_CHAT=gpt-5.1-mini
AZURE_OPENAI_DEPLOYMENT_IMAGE=gpt-image-1-mini
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=text-embedding-3-small

# Azure Storage
AZURE_STORAGE_ACCOUNT=stmahumsharedapps
AZURE_STORAGE_CONNECTION_STRING=<connection_string>
AZURE_STORAGE_CONTAINER=headshots

# Database
DATABASE_URL=postgresql://pgadmin:<password>@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require
# OR individual variables:
POSTGRES_HOST=pg-shared-apps-eastus2.postgres.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=profileperfect_db
POSTGRES_USER=pgadmin
POSTGRES_PASSWORD=<password>
```

## Setup Steps

### 1. Database Setup

```powershell
# Set environment variables
$env:POSTGRES_PASSWORD = "WalidSahab112025"
$env:POSTGRES_USER = "pgadmin"
$env:POSTGRES_HOST = "pg-shared-apps-eastus2.postgres.database.azure.com"
$env:POSTGRES_DB = "profileperfect_db"
$env:DATABASE_URL = "postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require"

# Run setup script
node scripts/setup-azure-db.js
```

### 2. Infrastructure Setup

```powershell
# Run PowerShell setup script
powershell scripts/profileperfect-setup.ps1
```

This will:
- Create blob containers (`profileperfect-uploads`, `profileperfect-generated`)
- Create database `profileperfect_db` if it doesn't exist
- Set up database user and permissions

### 3. Environment Configuration

```bash
# Copy example file
cp .env.example .env.local

# Get Azure OpenAI API key
az cognitiveservices account keys list \
  --resource-group rg-shared-ai \
  --name shared-openai-eastus2 \
  --query key1 -o tsv

# Get Storage connection string
az storage account show-connection-string \
  --resource-group rg-shared-ai \
  --name stmahumsharedapps \
  --query connectionString -o tsv
```

### 4. Start Development Server

```bash
npm install
npm run dev
```

## Next Steps

1. **Remove Google Generative AI**
   - Review `lib/ai/image-generation.ts` for Google GenAI usage
   - Replace with Azure OpenAI if needed
   - Remove `@google/generative-ai` from `package.json`

2. **Update README**
   - Remove Supabase references
   - Update with Azure PostgreSQL instructions
   - Update deployment instructions

3. **Verify Model Deployments**
   - Ensure `gpt-5.1-mini` exists (or use `gpt-5.1`)
   - Verify `gpt-image-1-mini` is deployed
   - Verify `text-embedding-3-small` is deployed

4. **Test Database Connection**
   - Run `/api/test-db` endpoint
   - Verify all tables exist
   - Test CRUD operations

5. **Production Deployment**
   - Configure Azure Static Web App or App Service
   - Set environment variables in Azure
   - Verify shared resource connectivity

## Documentation

- **Setup Script**: `scripts/setup-azure-db.js`
- **Schema**: `scripts/profileperfect-db.sql`
- **Infrastructure**: `scripts/profileperfect-setup.ps1`
- **Environment**: `.env.example`

## Status: ✅ Mostly Aligned

ProfilePerfectAI is already well-aligned with the unified stack. Main remaining tasks are:
- Remove Google Generative AI dependency
- Update README documentation
- Verify model deployments



