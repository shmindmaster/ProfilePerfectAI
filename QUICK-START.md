# ProfilePerfectAI - Quick Start Guide

## Prerequisites

- Node.js 18+
- Azure CLI installed and logged in
- Access to **mahumtech subscription** (ID: `44e77ffe-2c39-4726-b6f0-2c733c7ffe78`)

**Note**: All shared resources already exist:
- Shared Postgres: `pg-shared-apps-eastus2` (rg-shared-ai)
- Azure OpenAI: `shared-openai-eastus2` (rg-shared-ai)
- Storage: `stmahumsharedapps` (rg-shared-ai or rg-shared-web)

## Setup Steps

### 1. Clone and Navigate

```bash
cd ProfilePerfectAI
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment

```bash
# Copy example file
cp .env.example .env.local
```

**Required values** (get from Azure):

```bash
# Azure OpenAI API Key
az cognitiveservices account keys list \
  --resource-group rg-shared-ai \
  --name shared-openai-eastus2 \
  --query key1 -o tsv

# Azure Storage Connection String
az storage account show-connection-string \
  --resource-group rg-shared-ai \
  --name stmahumsharedapps \
  --query connectionString -o tsv
```

**Database URL** (already configured):
```env
DATABASE_URL=postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require
```

### 4. Setup Database

**Option A: Using Node.js Script (Recommended)**

```bash
# Set environment variables
export DATABASE_URL="postgresql://pgadmin:WalidSahab112025@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require"

# Run setup
node scripts/setup-azure-db.js
```

**Option B: Using PowerShell Script**

```powershell
powershell scripts/profileperfect-setup.ps1
```

This will:
- Create blob containers (`profileperfect-uploads`, `profileperfect-generated`)
- Create database `profileperfect_db` if it doesn't exist
- Set up database schema and sample data

### 5. Verify Setup

```bash
# Start development server
npm run dev

# In another terminal, test database connection
curl http://localhost:3000/api/test-db

# Test health endpoint
curl http://localhost:3000/api/health
```

### 6. Open Application

Navigate to [http://localhost:3000](http://localhost:3000)

## Key Endpoints

- **Health Check**: `GET http://localhost:3000/api/health`
- **Database Test**: `GET http://localhost:3000/api/test-db`
- **Generate Headshots**: `POST http://localhost:3000/api/generate`
- **Retouch Images**: `POST http://localhost:3000/api/retouch`
- **Upload Photos**: `POST http://localhost:3000/api/upload`

## Environment Variables Reference

### Required

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://shared-openai-eastus2.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT_CHAT=gpt-5.1-mini
AZURE_OPENAI_DEPLOYMENT_IMAGE=gpt-image-1-mini
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=text-embedding-3-small

# Azure Storage
AZURE_STORAGE_ACCOUNT=stmahumsharedapps
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER=headshots

# Database
DATABASE_URL=postgresql://pgadmin:<password>@pg-shared-apps-eastus2.postgres.database.azure.com:5432/profileperfect_db?sslmode=require
```

### Optional

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=<your-key>
STRIPE_WEBHOOK_SECRET=<your-secret>
NEXT_PUBLIC_STRIPE_IS_ENABLED=false
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` format in `.env.local`
- Check firewall rules for Azure Postgres
- Ensure password is URL-encoded if it contains special characters
- Test connection: `node scripts/setup-azure-db.js`

### Azure OpenAI Issues

- Verify API key is valid
- Check model deployments exist:
  ```bash
  az cognitiveservices account deployment list \
    --resource-group rg-shared-ai \
    --name shared-openai-eastus2
  ```

### Storage Issues

- Verify containers exist:
  ```bash
  az storage container list \
    --account-name stmahumsharedapps \
    --auth-mode login
  ```
- Check connection string format

## Next Steps

- Review `PROFILEPERFECT-ALIGNMENT-SUMMARY.md` for architecture details
- See `scripts/profileperfect-setup.ps1` for infrastructure setup
- Check `scripts/profileperfect-db.sql` for database schema

## Status: ✅ Ready to Run

All setup steps are complete. The application is ready to start!


