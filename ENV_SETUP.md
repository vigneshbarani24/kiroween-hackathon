# Environment Setup Guide

## Required Environment Variables

Create a file `resurrection-platform/.env.local` with the following variables:

```bash
# Required: OpenAI API Key for LLM transformation planning
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required: GitHub Personal Access Token for repository creation
GITHUB_TOKEN=ghp_your-github-token-here

# Optional: Slack Bot Token for notifications
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here

# Optional: OpenAI Configuration
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4000

# Database
DATABASE_URL="file:./dev.db"
```

## How to Get API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add to `.env.local` as `OPENAI_API_KEY=sk-...`

### GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token (starts with `ghp_`)
5. Add to `.env.local` as `GITHUB_TOKEN=ghp_...`

### Slack Bot Token (Optional)
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to "OAuth & Permissions"
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
5. Add to `.env.local` as `SLACK_BOT_TOKEN=xoxb_...`

## Verification

After creating `.env.local`, run:

```bash
cd resurrection-platform
npx tsx test-mcp-workflow.ts
```

This will verify:
- ✅ Environment variables are set correctly
- ✅ MCP servers can start
- ✅ All systems are ready for the hackathon demo
