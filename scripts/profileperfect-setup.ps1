param(
    [string]$SubscriptionId   = "44e77ffe-2c39-4726-b6f0-2c733c7ffe78",
    [string]$ResourceGroupWeb = "rg-shared-web",
    [string]$ResourceGroupAI  = "rg-shared-ai",
    [string]$Location         = "eastus2"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> Logging into Azure (if not already)..."
az account show *> $null 2>&1
if ($LASTEXITCODE -ne 0) {
  az login | Out-Null
}
az account set --subscription $SubscriptionId

# -------------------------------------------
# 1. STORAGE: Create containers (if missing)
# -------------------------------------------
$storageAccount = "stmahumsharedapps"
$uploads        = "profileperfect-uploads"
$generated      = "profileperfect-generated"

Write-Host ">>> Ensuring blob containers exist in $storageAccount..."

az storage container create `
  --name $uploads `
  --account-name $storageAccount `
  --auth-mode login | Out-Null

az storage container create `
  --name $generated `
  --account-name $storageAccount `
  --auth-mode login | Out-Null

# Optional: lightweight CORS for blobs (idempotent)
Write-Host ">>> (Optional) Setting basic CORS for Blob service..."
az storage cors add `
  --methods GET HEAD OPTIONS `
  --origins "*" `
  --allowed-headers "*" `
  --exposed-headers "*" `
  --max-age 200 `
  --services b `
  --account-name $storageAccount 2>$null | Out-Null

# -------------------------------------------
# 2. POSTGRES: Ensure DB + app user exist
# -------------------------------------------
$pgServer   = "pg-shared-apps-eastus2"
$dbName     = "profileperfect_db"
$dbUser     = "profileperfect_app"
$dbPassword = [Guid]::NewGuid().ToString("N") + "!Aa1"

Write-Host ">>> Ensuring Postgres database $dbName exists on $pgServer..."

az postgres flexible-server db create `
  --resource-group $ResourceGroupAI `
  --server-name $pgServer `
  --database-name $dbName `
  --only-show-errors 2>$null | Out-Null

Write-Host ">>> Creating/updating app user role (idempotent)..."

# NOTE: fill these with your real admin credentials before running.
$pgHost        = "$pgServer.postgres.database.azure.com"
$pgAdminUser   = "<PG_ADMIN_USER>@$pgServer"      # e.g. shared_admin@$pgServer
$pgAdminPass   = "<PG_ADMIN_PASSWORD>"            # DO NOT commit real values

if ($pgAdminUser -like "<PG_ADMIN_USER>*" -or $pgAdminPass -like "<PG_ADMIN_PASSWORD>*") {
  Write-Warning "PG admin credentials are placeholders. Edit scripts/profileperfect-setup.ps1 before running."
} else {
  $env:PGPASSWORD = $pgAdminPass

  $createUserSql = @"
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$dbUser') THEN
    CREATE ROLE $dbUser LOGIN PASSWORD '$dbPassword';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE $dbName TO $dbUser;
"@

  Write-Host ">>> Running role-creation SQL..."
  echo $createUserSql | psql `
    "host=$pgHost port=5432 dbname=postgres user=$pgAdminUser sslmode=require" | Out-Null

  $grantSql = @"
GRANT USAGE ON SCHEMA public TO $dbUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $dbUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $dbUser;
"@

  Write-Host ">>> Granting default privileges on $dbName..."
  echo $grantSql | psql `
    "host=$pgHost port=5432 dbname=$dbName user=$pgAdminUser sslmode=require" | Out-Null

  Write-Host "--------------------------------------------------------"
  Write-Host "DATABASE_URL=postgresql://$dbUser:$dbPassword@$pgHost:5432/$dbName?sslmode=require"
  Write-Host "POSTGRES_HOST=$pgHost"
  Write-Host "POSTGRES_PORT=5432"
  Write-Host "POSTGRES_DB=$dbName"
  Write-Host "POSTGRES_USER=$dbUser"
  Write-Host "POSTGRES_PASSWORD=$dbPassword"
  Write-Host "--------------------------------------------------------"
  Write-Host ">>> Copy these into .env.local and GitHub/Copilot secrets for ProfilePerfectAI."
}
