# Quick Start: Custom Code Intelligence

## 🎯 Goal
Build Custom Code Intelligence in 5 days to complement your already-working AI Build transformation.

---

## ✅ What You'll Build

1. **Auto-Documentation** - AI generates markdown docs from ABAP
2. **Q&A Interface** - Ask questions about code in natural language
3. **Dependency Graphs** - Visual dependency analysis
4. **Redundancy Detection** - Find duplicate/similar code
5. **Searchable Inventory** - Semantic search across all code

---

## 🚀 Day 1: Get Started (2-3 hours)

### Step 1: Install Dependencies
```bash
cd src/backend
npm install @pinecone-database/pinecone openai bull redis
npm install --save-dev @types/bull

cd ../frontend
npm install react-markdown d3 @types/d3
```

### Step 2: Setup Environment Variables
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://localhost:5432/sap_intelligence
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key_here
PINECONE_API_KEY=your_pinecone_key_here
EOF
```

### Step 3: Get API Keys

**OpenAI (for embeddings + chat):**
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Add to .env

**Pinecone (for vector search):**
1. Go to https://www.pinecone.io/
2. Sign up (free tier: 100K vectors)
3. Create API key
4. Add to .env

### Step 4: Create Documentation Generator
Copy the code from the implementation spec:
- `src/backend/services/documentationGenerator.ts`
- `src/backend/routes/intelligence.ts`

### Step 5: Test It!
```bash
# Start backend
cd src/backend
npm run dev

# Test documentation generation
curl -X POST http://localhost:3000/api/intelligence/generate-docs \
  -H "Content-Type: application/json" \
  -d '{"abapCode": "FUNCTION z_test..."}'
```

---

## 📊 Progress Checklist

### Day 1: Documentation ✅
- [ ] Install dependencies
- [ ] Setup API keys
- [ ] Create DocumentationGenerator service
- [ ] Create API endpoint
- [ ] Test with sample ABAP code

### Day 2: Vector Search ✅
- [ ] Setup Pinecone index
- [ ] Create VectorSearchService
- [ ] Add indexing to doc generation
- [ ] Test semantic search

### Day 3: Q&A Interface ✅
- [ ] Create QAService (RAG)
- [ ] Create Q&A API endpoint
- [ ] Build QAInterface component
- [ ] Test with questions

### Day 4: Dependency Graph ✅
- [ ] Create DependencyGraphService
- [ ] Build D3.js visualization
- [ ] Add impact analysis
- [ ] Test with multiple files

### Day 5: Dashboard ✅
- [ ] Create RedundancyDetector
- [ ] Build IntelligenceDashboard
- [ ] Add stats and metrics
- [ ] Polish UI/UX

---

## 🎬 Demo Flow

1. **Upload ABAP Files**
   - Show drag-and-drop interface
   - Upload 5-10 sample ABAP files

2. **Auto-Documentation**
   - Show generated markdown docs
   - Highlight business logic extraction

3. **Ask Questions**
   - "What does the pricing function do?"
   - "Which functions access the VBAK table?"
   - Show AI answers with sources

4. **Dependency Graph**
   - Show interactive visualization
   - Click on node to see dependencies
   - Show impact analysis

5. **Redundancy Report**
   - Show duplicate code detection
   - Display similarity scores
   - Show consolidation recommendations

6. **Transform to Modern**
   - Select file to transform
   - Show ABAP → CAP → Fiori (already built!)
   - Download complete modern app

---

## 💡 Tips

### Use Sample ABAP Code
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

### Test Questions
- "What does the discount calculation function do?"
- "Which tables are used for customer data?"
- "How is the pricing logic implemented?"
- "What functions depend on VBAK table?"

### Optimize Costs
- Use OpenAI text-embedding-3-small (cheap!)
- Use GPT-4-turbo-preview for chat (faster + cheaper than GPT-4)
- Pinecone free tier: 100K vectors (plenty for demo)

---

## 🏆 Success Criteria

### Must Have:
- ✅ Documentation generation works
- ✅ Q&A answers questions accurately
- ✅ Dependency graph visualizes relationships
- ✅ UI is polished and intuitive

### Nice to Have:
- ✅ Redundancy detection
- ✅ Batch processing
- ✅ Export reports
- ✅ Advanced search filters

---

## 🚨 Common Issues

### Issue: Pinecone index not found
**Solution:** Run initialization:
```typescript
await vectorSearch.initialize();
```

### Issue: OpenAI rate limits
**Solution:** Add retry logic or use smaller batches

### Issue: D3.js graph not rendering
**Solution:** Check SVG dimensions and data format

---

## 📚 Resources

- **Implementation Spec:** `.kiro/specs/custom-code-intelligence-implementation.md`
- **OpenAI Docs:** https://platform.openai.com/docs
- **Pinecone Docs:** https://docs.pinecone.io/
- **D3.js Examples:** https://observablehq.com/@d3/gallery

---

## ✅ Ready to Start?

**Run this to begin:**
```bash
# 1. Install dependencies
cd src/backend && npm install @pinecone-database/pinecone openai

# 2. Create services directory
mkdir -p src/backend/services

# 3. Start coding!
code src/backend/services/documentationGenerator.ts
```

**You've got this! 5 days to a complete Custom Code Intelligence platform!** 🚀
