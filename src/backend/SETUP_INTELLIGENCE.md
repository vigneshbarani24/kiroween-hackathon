# Setup Custom Code Intelligence

## Step 1: Install Dependencies

```bash
cd src/backend
npm install openai @pinecone-database/pinecone bull redis
npm install --save-dev @types/bull
```

## Step 2: Setup Environment Variables

Add to your `.env` file:

```env
# OpenAI for embeddings and chat
OPENAI_API_KEY=sk-...

# Pinecone for vector search
PINECONE_API_KEY=...

# Redis for queue (if not already set)
REDIS_URL=redis://localhost:6379

# Database (if not already set)
DATABASE_URL=postgresql://localhost:5432/sap_intelligence
```

## Step 3: Get API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to .env as OPENAI_API_KEY

### Pinecone
1. Go to https://www.pinecone.io/
2. Sign up (free tier: 100K vectors)
3. Create API key
4. Add to .env as PINECONE_API_KEY

## Step 4: Start Redis (for queue)

```bash
# macOS
brew install redis
brew services start redis

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

## Step 5: Run the Server

```bash
npm run dev
```

Server will start on http://localhost:3001

## Step 6: Test

```bash
# Health check
curl http://localhost:3001/health

# Test documentation generation (after implementing)
curl -X POST http://localhost:3001/api/intelligence/generate-docs \
  -H "Content-Type: application/json" \
  -d '{"abapCode": "FUNCTION z_test..."}'
```

## Costs (for demo)

- **Pinecone:** Free tier (100K vectors)
- **OpenAI:** 
  - Embeddings: ~$0.0001 per 1K tokens (~$1 for 10K files)
  - Chat: ~$0.01 per 1K tokens (~$5-10 for demo)
- **Total:** < $15 for complete demo

## Next Steps

1. Install dependencies ✅
2. Setup API keys ✅
3. Create services (see src/backend/services/)
4. Create routes (see src/backend/src/routes/)
5. Test endpoints
6. Build frontend
