# AGENTS.md - ProfilePerfectAI

AI coding agent guide for ProfilePerfectAI, an AI headshot generator and profile photo optimization platform.

## Project Overview

**Application**: AI Headshot & Profile Photo Studio  
**URL**: https://profileperfect-ai.azurewebsites.net  
**Stack**: Next.js 14 App Router + Azure PostgreSQL + Azure OpenAI + Azure Storage

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript (app router)
- **Backend**: Next.js API routes (`app/api/generate`, `app/api/retouch`, `app/api/health`)
- **Database**: Azure PostgreSQL `profileperfect_db` on shared `pg-shared-apps-eastus2`
- **Storage**: Azure Blob Storage `stmahumsharedapps` (containers `profileperfect-uploads`, `profileperfect-generated`)
- **AI – Primary**: Azure OpenAI via `lib/ai/image-generation.ts`
  - Chat/vision: `gpt-5.1-mini` (via `AZURE_OPENAI_DEPLOYMENT_CHAT`)
  - Images: `gpt-image-1-mini` (via `AZURE_OPENAI_DEPLOYMENT_IMAGE`)
- **AI – Optional**: Google Generative AI ("Nano Banana" / `gemini-2.5-flash-image`) for retouch flows if `GOOGLE_NANO_BANANA_API_KEY` is configured

## Build & Test Commands

```bash
npm install
npm run build
npm run dev
npm run lint
```

## Coding Conventions

- Next.js 14 app router patterns
- TypeScript strict mode
- Always use shared MahumTech Postgres + Azure OpenAI + Storage

## Environment Variables

See `.env.example`. Key categories:
- Azure OpenAI: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT_CHAT`, `AZURE_OPENAI_DEPLOYMENT_IMAGE`
- Database: `DATABASE_URL` pointing to `pg-shared-apps-eastus2` / `profileperfect_db`
- Storage: `AZURE_STORAGE_CONNECTION_STRING`, `APP_BLOB_CONTAINER_UPLOADS`, `APP_BLOB_CONTAINER_GENERATED`
- Optional retouch backend: `GOOGLE_NANO_BANANA_API_KEY`

## PR Guidelines

- Title: `[ProfilePerfectAI] Description`
- All tests passing
- No TypeScript errors

## MCP Integration

Use Context7 MCP for Next.js and Azure OpenAI documentation.
