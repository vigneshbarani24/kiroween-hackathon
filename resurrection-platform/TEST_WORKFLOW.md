# Test Workflow - End to End

## Step 1: Upload ABAP File

```bash
curl -X POST http://localhost:3000/api/abap/upload \
  -F "file=@src/abap-samples/sales-order-processing.abap"
```

Expected Response:
```json
{
  "success": true,
  "object": {
    "id": "uuid",
    "name": "sales-order-processing",
    "type": "FUNCTION",
    "module": "SD",
    "linesOfCode": 150
  }
}
```

## Step 2: Create Resurrection

```bash
curl -X POST http://localhost:3000/api/resurrections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-resurrection",
    "description": "Test transformation",
    "abapObjectIds": ["<object-id-from-step-1>"]
  }'
```

Expected Response:
```json
{
  "success": true,
  "resurrection": {
    "id": "uuid",
    "name": "test-resurrection",
    "status": "UPLOADED"
  }
}
```

## Step 3: Start Transformation

```bash
curl -X POST http://localhost:3000/api/resurrections/<resurrection-id>/start
```

Expected Response:
```json
{
  "success": true,
  "message": "Resurrection workflow started",
  "resurrection": {
    "id": "uuid",
    "status": "ANALYZING",
    "steps": [
      { "name": "ANALYZE", "status": "IN_PROGRESS" },
      { "name": "PLAN", "status": "PENDING" },
      { "name": "GENERATE", "status": "PENDING" },
      { "name": "VALIDATE", "status": "PENDING" },
      { "name": "DEPLOY", "status": "PENDING" }
    ]
  }
}
```

## Step 4: Check Status

```bash
curl http://localhost:3000/api/resurrections/<resurrection-id>/status
```

Expected Response (when complete):
```json
{
  "resurrection": {
    "id": "uuid",
    "name": "test-resurrection",
    "status": "COMPLETED",
    "githubUrl": "https://github.com/user/resurrection-test-...",
    "basUrl": "https://bas.region.hana.ondemand.com/...",
    "qualityScore": 92
  }
}
```

## What Should Happen

1. ✅ ABAP file uploaded and parsed
2. ✅ Resurrection created with ABAP objects
3. ✅ Workflow starts (5 steps)
4. ✅ Step 1 (ANALYZE): Extract business logic, tables, dependencies
5. ✅ Step 2 (PLAN): Create transformation plan
6. ✅ Step 3 (GENERATE): Generate CAP code (CDS, services, UI)
7. ✅ Step 4 (VALIDATE): Check quality and compliance
8. ✅ Step 5 (DEPLOY): Create GitHub repo with complete CAP project
9. ✅ Status updates to COMPLETED
10. ✅ GitHub URL and BAS link available

## Current Issues

- [ ] JSON parsing in workflow (markdown code blocks from OpenAI)
- [ ] Quality endpoint missing
- [ ] GitHub repo creation needs token
- [ ] Real-time progress updates not working

## Fixes Applied

- [x] JSON parsing now handles markdown code blocks
- [x] Quality endpoint created
- [ ] Need to test end-to-end
