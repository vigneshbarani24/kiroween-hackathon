# Testing Custom Code Intelligence

## Prerequisites

1. **Install dependencies:**
```bash
cd src/backend
npm install openai @pinecone-database/pinecone
```

2. **Setup .env file:**
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PORT=3001
```

3. **Start the server:**
```bash
npm run dev
```

---

## Test 1: Generate Documentation

### Sample ABAP Code
```abap
FUNCTION z_calculate_discount.
  DATA: lv_discount TYPE p DECIMALS 2,
        lv_total TYPE p DECIMALS 2.
  
  SELECT SUM( netwr ) FROM vbak
    INTO lv_total
    WHERE kunnr = iv_customer_id.
  
  IF lv_total > 1000.
    lv_discount = lv_total * '0.10'.
  ELSE.
    lv_discount = 0.
  ENDIF.
  
  ev_discount = lv_discount.
ENDFUNCTION.
```

### API Call
```bash
curl -X POST http://localhost:3001/api/intelligence/generate-docs \
  -H "Content-Type: application/json" \
  -d '{
    "abapCode": "FUNCTION z_calculate_discount...",
    "analysis": {
      "name": "Z_CALCULATE_DISCOUNT",
      "type": "FUNCTION",
      "module": "SD",
      "businessLogic": [
        {
          "type": "calculation",
          "description": "Calculate 10% discount for orders over $1000"
        }
      ],
      "dependencies": [],
      "tables": [
        {
          "name": "VBAK",
          "operation": "SELECT",
          "description": "Sales Document Header"
        }
      ],
      "linesOfCode": 15,
      "complexity": 3
    }
  }'
```

### Expected Response
```json
{
  "id": "doc-1234567890-Z_CALCULATE_DISCOUNT",
  "documentation": "# Z_CALCULATE_DISCOUNT\n\n## Overview\n...",
  "metadata": { ... },
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Test 2: Ask Questions (Q&A)

### After indexing some code, ask questions:

```bash
curl -X POST http://localhost:3001/api/intelligence/qa \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does the discount calculation function do?"
  }'
```

### Expected Response
```json
{
  "question": "What does the discount calculation function do?",
  "answer": "According to Z_CALCULATE_DISCOUNT, this function calculates a 10% discount for customers whose total order value exceeds $1000. It queries the VBAK table (Sales Document Header) to sum up the net value (netwr) for a given customer ID. If the total is greater than 1000, it applies a 10% discount; otherwise, no discount is applied.",
  "sources": [
    {
      "name": "Z_CALCULATE_DISCOUNT",
      "type": "FUNCTION",
      "module": "SD",
      "relevance": 0.95
    }
  ],
  "confidence": "high"
}
```

---

## Test 3: Semantic Search

```bash
curl -X POST http://localhost:3001/api/intelligence/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pricing and discounts",
    "topK": 3
  }'
```

### Expected Response
```json
{
  "query": "pricing and discounts",
  "results": [
    {
      "id": "doc-...",
      "name": "Z_CALCULATE_DISCOUNT",
      "type": "FUNCTION",
      "module": "SD",
      "relevance": 0.92,
      "preview": "This function calculates discounts..."
    },
    {
      "id": "doc-...",
      "name": "Z_PRICING_PROCEDURE",
      "type": "FUNCTION",
      "module": "SD",
      "relevance": 0.88,
      "preview": "Implements pricing logic..."
    }
  ]
}
```

---

## Test 4: Get Statistics

```bash
curl http://localhost:3001/api/intelligence/stats
```

### Expected Response
```json
{
  "namespaces": {
    "": {
      "vectorCount": 15
    }
  },
  "dimension": 1536,
  "indexFullness": 0.00015,
  "totalVectorCount": 15
}
```

---

## Test 5: Batch Documentation Generation

```bash
curl -X POST http://localhost:3001/api/intelligence/generate-docs-batch \
  -H "Content-Type: application/json" \
  -d '{
    "analyses": [
      {
        "name": "Z_FUNCTION_1",
        "type": "FUNCTION",
        "module": "SD",
        "businessLogic": [...],
        "dependencies": [],
        "tables": []
      },
      {
        "name": "Z_FUNCTION_2",
        "type": "FUNCTION",
        "module": "MM",
        "businessLogic": [...],
        "dependencies": [],
        "tables": []
      }
    ]
  }'
```

---

## Test 6: Generate Summary

```bash
curl -X POST http://localhost:3001/api/intelligence/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "analyses": [
      { "name": "Z_FUNC_1", "type": "FUNCTION", "module": "SD", "linesOfCode": 50 },
      { "name": "Z_FUNC_2", "type": "FUNCTION", "module": "MM", "linesOfCode": 75 },
      { "name": "Z_REPORT_1", "type": "REPORT", "module": "FI", "linesOfCode": 200 }
    ]
  }'
```

---

## Sample Questions to Test

1. "What does the pricing calculation function do?"
2. "Which functions access the VBAK table?"
3. "How is customer credit limit validated?"
4. "What business logic is implemented for discounts?"
5. "Which modules have the most custom code?"
6. "What are the dependencies of Z_CALCULATE_DISCOUNT?"
7. "How does the order processing work?"
8. "What SAP tables are used for customer data?"

---

## Troubleshooting

### Error: "Pinecone index not found"
**Solution:** Wait 10 seconds after server starts for index creation

### Error: "OpenAI API key invalid"
**Solution:** Check your .env file has correct OPENAI_API_KEY

### Error: "Rate limit exceeded"
**Solution:** Wait 1 minute, OpenAI has rate limits

### No search results
**Solution:** Make sure you've indexed some code first using /generate-docs

---

## Next Steps

1. ✅ Test documentation generation
2. ✅ Index multiple ABAP files
3. ✅ Test Q&A with various questions
4. ✅ Test semantic search
5. 🔨 Build frontend UI
6. 🔨 Add dependency graph visualization
7. 🔨 Add redundancy detection

---

**Day 1 Complete! Documentation Generator + Vector Search + Q&A working!** 🎉
