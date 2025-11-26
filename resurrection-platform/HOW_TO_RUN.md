# How to Run the Real Resurrection Platform

## Prerequisites

1. **Python 3** - For ABAP Analyzer MCP server
2. **Node.js 18+** - Already installed
3. **SAP CDS CLI** - Already installed globally
4. **PostgreSQL** - Already running
5. **GitHub Token** - Set in `.env.local`

---

## Step 1: Check Environment Variables

Make sure these are set in `resurrection-platform/.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resurrection"

# GitHub (for repo creation)
GITHUB_TOKEN="your_github_token_here"

# OpenAI (optional - for fallback)
OPENAI_API_KEY="your_openai_key_here"
```

---

## Step 2: Make Python Script Executable

```bash
# Make the ABAP analyzer executable
chmod +x .kiro/mcp/abap-analyzer.py

# Test it works
python3 .kiro/mcp/abap-analyzer.py
# Should print: "ABAP Analyzer MCP Server started"
# Press Ctrl+C to exit
```

---

## Step 3: Start the Dev Server

```bash
cd resurrection-platform
npm run dev
```

Server should start on `http://localhost:3000`

---

## Step 4: Test the Real Workflow

### Option A: Use the Test Script

```bash
# In a new terminal
cd resurrection-platform
node scripts/simple-test.js
```

This will:
1. Upload the sample ABAP file
2. Create a resurrection
3. Start the transformation
4. Wait for completion
5. Show the GitHub repo URL

### Option B: Use the API Manually

**1. Upload ABAP file:**
```bash
curl -X POST http://localhost:3000/api/abap/upload \
  -F "file=@../src/abap-samples/sales-order-processing.abap"
```

Response:
```json
{
  "success": true,
  "object": {
    "id": "abc-123",
    "name": "sales-order-processing",
    "linesOfCode": 95
  }
}
```

**2. Create resurrection:**
```bash
curl -X POST http://localhost:3000/api/resurrections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-resurrection",
    "description": "Test",
    "module": "SD",
    "abapObjectIds": ["abc-123"]
  }'
```

Response:
```json
{
  "success": true,
  "resurrection": {
    "id": "xyz-789",
    "name": "test-resurrection",
    "status": "UPLOADED"
  }
}
```

**3. Start transformation:**
```bash
curl -X POST http://localhost:3000/api/resurrections/xyz-789/start \
  -H "Content-Type: application/json" \
  -d '{"useKiroSpec": false}'
```

**4. Check status:**
```bash
curl http://localhost:3000/api/resurrections/xyz-789/status
```

---

## Step 5: Verify Real Output

### Check the Logs

In the dev server terminal, you should see:

```
[RealWorkflow] Starting REAL workflow for resurrection xyz-789
[RealWorkflow] Step 1: ANALYZE - Using ABAP Analyzer MCP
[MCPOrchestrator] Connected to abap-analyzer
[RealWorkflow] Step 2: PLAN - Creating transformation plan
[RealWorkflow] Step 3: GENERATE - Using CAP CLI
[RealWorkflow] Running: cds init resurrection-test-resurrection
[RealWorkflow] Step 4: VALIDATE - Validating generated CAP project
[RealWorkflow] Running: cds build
[RealWorkflow] Step 5: DEPLOY - Creating GitHub repo with real files
[RealWorkflow] Workflow completed successfully
```

### Check the Generated Files

The CAP project is created in:
```
resurrection-platform/temp/resurrections/resurrection-test-resurrection/
├── db/
│   └── schema.cds          ← Real CDS entities
├── srv/
│   ├── service.cds         ← Real service definition
│   └── service.js          ← Real business logic
├── package.json
└── README.md
```

### Check the GitHub Repo

The test will output a GitHub URL like:
```
https://github.com/your-username/resurrection-test-resurrection-1234567890
```

Clone it and verify:
```bash
git clone https://github.com/your-username/resurrection-test-resurrection-1234567890
cd resurrection-test-resurrection-1234567890
npm install
cds watch
```

Should start a working CAP server!

---

## Troubleshooting

### Error: "Python not found"

**Fix:**
```bash
# Check Python is installed
python3 --version

# If not, install it
# macOS: brew install python3
# Ubuntu: sudo apt install python3
# Windows: Download from python.org
```

### Error: "cds command not found"

**Fix:**
```bash
# Install SAP CDS CLI globally
npm install -g @sap/cds-dk

# Verify
cds --version
```

### Error: "MCP server connection failed"

**Fix:**
```bash
# Test the Python MCP server manually
cd .kiro/mcp
python3 abap-analyzer.py

# Should print: "ABAP Analyzer MCP Server started"
# If it errors, check Python syntax
```

### Error: "GitHub token invalid"

**Fix:**
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Create new token with `repo` scope
3. Add to `.env.local`:
   ```
   GITHUB_TOKEN="ghp_your_token_here"
   ```

### Error: "Database connection failed"

**Fix:**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Run migrations
cd resurrection-platform
npx prisma migrate dev
```

### Error: "cds build failed"

This is actually GOOD - it means validation is working!

The workflow will:
- Still complete
- Mark quality score lower
- Log the errors

Check the logs to see what CDS syntax errors were found.

---

## What Happens During a Real Resurrection

### 1. ANALYZE (10-20 seconds)
- Python MCP server parses ABAP code
- Extracts business logic, tables, dependencies
- Detects SAP patterns (pricing, authorization, etc.)
- Generates documentation

### 2. PLAN (5-10 seconds)
- Maps ABAP tables → CDS entities
- Maps ABAP functions → CAP services
- Creates transformation plan

### 3. GENERATE (30-60 seconds)
- Runs `cds init project-name`
- Generates `db/schema.cds` from ABAP tables
- Generates `srv/service.cds` from ABAP functions
- Generates `srv/service.js` with business logic
- Creates `package.json`, `README.md`

### 4. VALIDATE (10-20 seconds)
- Runs `cds build` to check syntax
- Validates project structure
- Calculates quality score

### 5. DEPLOY (20-40 seconds)
- Creates GitHub repository
- Commits all generated files
- Adds topics and README
- Returns repo URL

**Total Time: 2-3 minutes**

---

## Expected Output

### Console Output
```
🚀 Starting End-to-End Test

Step 1: Uploading ABAP file...
✅ Upload successful!
   Object ID: abc-123
   Name: sales-order-processing
   LOC: 95

Step 2: Creating resurrection...
✅ Resurrection created!
   ID: xyz-789
   Name: test-resurrection
   Status: UPLOADED

Step 3: Starting transformation workflow...
✅ Transformation started!
   Status: ANALYZING
   Estimated duration: 3-5 minutes

Step 4: Waiting for completion...
   📍 Status: ANALYZING (0%)
   📍 Status: PLANNING (20%)
   📍 Status: GENERATING (40%)
   📍 Status: VALIDATING (60%)
   📍 Status: DEPLOYING (80%)
   📍 Status: COMPLETED (100%)

✅ Workflow completed successfully!
   GitHub URL: https://github.com/user/resurrection-test-resurrection-1234567890
   BAS URL: https://bas.eu10.hana.ondemand.com/?gitClone=...
   Quality Score: 90

🎉 All tests passed!
```

### GitHub Repository Contents
```
resurrection-test-resurrection-1234567890/
├── .gitignore
├── README.md                    ← With ABAP transformation details
├── package.json                 ← With @sap/cds dependencies
├── db/
│   └── schema.cds              ← CDS entities from ABAP tables
├── srv/
│   ├── service.cds             ← Service definition
│   └── service.js              ← Business logic from ABAP
└── app/                        ← (Future: Fiori UI)
```

---

## Quick Start (TL;DR)

```bash
# 1. Set environment variables
echo 'GITHUB_TOKEN="your_token"' >> resurrection-platform/.env.local

# 2. Start server
cd resurrection-platform
npm run dev

# 3. Run test (in new terminal)
node scripts/simple-test.js

# 4. Check GitHub for your new repo!
```

---

## Next Steps

Once you verify it works:

1. **Test with different ABAP code** - Try other samples
2. **Enhance the ABAP analyzer** - Add more pattern detection
3. **Improve CAP generation** - Better service implementations
4. **Add UI generation** - Use UI5 MCP server
5. **Add Slack notifications** - Use Slack MCP server

---

**Status: Ready to Run! 🚀**
