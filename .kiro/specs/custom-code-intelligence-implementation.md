# Custom Code Intelligence - Implementation Plan

## Overview

Build the **Custom Code Intelligence** pillar to complement the already-working **AI Build** transformation.

**Features:**
1. Auto-generate documentation from ABAP
2. Q&A interface (ask questions about code)
3. Dependency graph visualization
4. Redundancy detection
5. Searchable code inventory

**Timeline:** 3-5 days

---

## Architecture

```
ABAP Code (Input)
       ↓
┌─────────────────────────────────────────────────────────┐
│ 1. PARSE & ANALYZE                                      │
│    - ABAP Analyzer MCP (already built!)                │
│    - Extract metadata, dependencies, business logic     │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. GENERATE DOCUMENTATION                               │
│    - Kiro AI generates markdown docs                   │
│    - Include purpose, logic, dependencies, usage       │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. INDEX FOR SEARCH                                     │
│    - Generate embeddings (OpenAI)                      │
│    - Store in vector DB (Pinecone/Weaviate)           │
│    - Enable semantic search                            │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Q&A INTERFACE (RAG)                                  │
│    - Natural language questions                         │
│    - Retrieve relevant code                            │
│    - Generate answers with Kiro AI                     │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│ 5. VISUALIZATIONS                                       │
│    - Dependency graphs (D3.js)                         │
│    - Redundancy reports                                │
│    - Code metrics dashboard                            │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Runtime:** Node.js 18+ / TypeScript
- **Framework:** Express.js (already using)
- **Database:** PostgreSQL (metadata storage)
- **Vector DB:** Pinecone (semantic search) - Free tier: 100K vectors
- **Embeddings:** OpenAI text-embedding-3-small
- **Queue:** Bull + Redis (batch processing)

### Frontend
- **Framework:** React (already using)
- **UI:** Material-UI or SAP UI5
- **Visualization:** D3.js or React Flow (dependency graphs)
- **Code Display:** Monaco Editor
- **Markdown:** react-markdown

### AI
- **LLM:** Claude via Kiro
- **Embeddings:** OpenAI API
- **RAG:** Simple implementation (no LangChain needed for MVP)

---

## Implementation Steps

### Day 1: Setup & Documentation Generator

#### 1.1 Install Dependencies
```bash
cd src/backend
npm install @pinecone-database/pinecone openai bull redis
npm install --save-dev @types/bull

cd ../frontend
npm install react-markdown d3 @types/d3 react-flow-renderer
```

#### 1.2 Create Documentation Generator Service
```typescript
// src/backend/services/documentationGenerator.ts
import { OpenAI } from 'openai';

interface ABAPAnalysis {
  name: string;
  type: string;
  module: string;
  businessLogic: any[];
  dependencies: any[];
  tables: any[];
}

export class DocumentationGenerator {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async generateDocumentation(analysis: ABAPAnalysis): Promise<string> {
    const prompt = `
You are an SAP expert. Generate comprehensive documentation for this ABAP code.

ABAP Object: ${analysis.name}
Type: ${analysis.type}
Module: ${analysis.module}

Business Logic:
${JSON.stringify(analysis.businessLogic, null, 2)}

Dependencies:
${JSON.stringify(analysis.dependencies, null, 2)}

Database Tables:
${JSON.stringify(analysis.tables, null, 2)}

Generate markdown documentation with:
1. ## Overview - What this code does
2. ## Business Logic - Detailed explanation
3. ## Dependencies - What it depends on
4. ## Database Operations - Tables and operations
5. ## Usage - How to use this code
6. ## Modernization Notes - Recommendations for modernization

Be specific and technical. Use SAP terminology.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return response.choices[0].message.content || '';
  }
}
```

#### 1.3 Create API Endpoint
```typescript
// src/backend/routes/intelligence.ts
import express from 'express';
import { DocumentationGenerator } from '../services/documentationGenerator';

const router = express.Router();
const docGen = new DocumentationGenerator();

router.post('/generate-docs', async (req, res) => {
  try {
    const { abapCode } = req.body;
    
    // 1. Parse ABAP using MCP
    const analysis = await parseABAP(abapCode);
    
    // 2. Generate documentation
    const documentation = await docGen.generateDocumentation(analysis);
    
    // 3. Save to database
    const doc = await db.documentation.create({
      data: {
        abapCode,
        analysis,
        markdown: documentation,
        generatedAt: new Date()
      }
    });
    
    res.json({ id: doc.id, documentation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

### Day 2: Vector Search & Indexing

#### 2.1 Setup Pinecone
```typescript
// src/backend/services/vectorSearch.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

export class VectorSearchService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName = 'abap-code';
  
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  async initialize() {
    // Create index if it doesn't exist
    const indexes = await this.pinecone.listIndexes();
    
    if (!indexes.indexes?.find(i => i.name === this.indexName)) {
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: 1536, // text-embedding-3-small dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
    }
  }
  
  async indexCode(
    id: string,
    abapCode: string,
    documentation: string,
    metadata: any
  ) {
    // Generate embedding
    const embedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: `${abapCode}\n\n${documentation}`
    });
    
    // Store in Pinecone
    const index = this.pinecone.index(this.indexName);
    await index.upsert([{
      id,
      values: embedding.data[0].embedding,
      metadata: {
        name: metadata.name,
        type: metadata.type,
        module: metadata.module,
        documentation: documentation.substring(0, 1000) // First 1000 chars
      }
    }]);
  }
  
  async search(query: string, topK: number = 5) {
    // Generate query embedding
    const queryEmbedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    
    // Search Pinecone
    const index = this.pinecone.index(this.indexName);
    const results = await index.query({
      vector: queryEmbedding.data[0].embedding,
      topK,
      includeMetadata: true
    });
    
    return results.matches;
  }
}
```

#### 2.2 Add Indexing to Documentation Flow
```typescript
// Update the generate-docs endpoint
router.post('/generate-docs', async (req, res) => {
  try {
    const { abapCode } = req.body;
    
    // 1. Parse ABAP
    const analysis = await parseABAP(abapCode);
    
    // 2. Generate documentation
    const documentation = await docGen.generateDocumentation(analysis);
    
    // 3. Save to database
    const doc = await db.documentation.create({
      data: {
        abapCode,
        analysis,
        markdown: documentation,
        generatedAt: new Date()
      }
    });
    
    // 4. Index for search
    await vectorSearch.indexCode(
      doc.id,
      abapCode,
      documentation,
      analysis
    );
    
    res.json({ id: doc.id, documentation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### Day 3: Q&A Interface (RAG)

#### 3.1 Create Q&A Service
```typescript
// src/backend/services/qaService.ts
import { VectorSearchService } from './vectorSearch';
import { OpenAI } from 'openai';

export class QAService {
  private vectorSearch: VectorSearchService;
  private openai: OpenAI;
  
  constructor(vectorSearch: VectorSearchService) {
    this.vectorSearch = vectorSearch;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  async answerQuestion(question: string) {
    // 1. Search for relevant code
    const relevantCode = await this.vectorSearch.search(question, 5);
    
    // 2. Build context from search results
    const context = relevantCode
      .map((match, i) => `
[Source ${i + 1}: ${match.metadata?.name}]
${match.metadata?.documentation}
`)
      .join('\n\n');
    
    // 3. Generate answer using RAG
    const prompt = `
You are an SAP expert assistant. Answer questions about SAP custom code based on the provided documentation.

Context from SAP custom code:
${context}

Question: ${question}

Provide a clear, technical answer based on the code documentation above. 
If the answer isn't in the documentation, say so.
Cite specific code objects when relevant.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return {
      question,
      answer: response.choices[0].message.content,
      sources: relevantCode.map(m => ({
        name: m.metadata?.name,
        type: m.metadata?.type,
        relevance: m.score
      }))
    };
  }
}
```

#### 3.2 Create Q&A API Endpoint
```typescript
// src/backend/routes/intelligence.ts
router.post('/qa', async (req, res) => {
  try {
    const { question } = req.body;
    
    const answer = await qaService.answerQuestion(question);
    
    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 3.3 Create Q&A Frontend Component
```typescript
// src/frontend/src/components/QAInterface.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function QAInterface() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handleAsk = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/intelligence/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      setAnswer(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="qa-interface">
      <h2>Ask Questions About Your SAP Code</h2>
      
      <div className="question-input">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What does the pricing calculation function do?"
          rows={3}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
      
      {answer && (
        <div className="answer">
          <h3>Answer:</h3>
          <ReactMarkdown>{answer.answer}</ReactMarkdown>
          
          <h4>Sources:</h4>
          <ul>
            {answer.sources.map((source: any, i: number) => (
              <li key={i}>
                {source.name} ({source.type}) - 
                Relevance: {(source.relevance * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---


### Day 4: Dependency Graph Visualization

#### 4.1 Create Dependency Graph Service
```typescript
// src/backend/services/dependencyGraph.ts
export class DependencyGraphService {
  buildGraph(analyses: ABAPAnalysis[]) {
    const nodes = analyses.map(a => ({
      id: a.name,
      type: a.type,
      module: a.module,
      linesOfCode: a.linesOfCode
    }));
    
    const links: any[] = [];
    
    analyses.forEach(analysis => {
      analysis.dependencies.forEach(dep => {
        links.push({
          source: analysis.name,
          target: dep.name,
          type: dep.type // 'calls', 'uses', 'includes'
        });
      });
    });
    
    return { nodes, links };
  }
  
  findImpact(objectName: string, graph: any) {
    // Find all objects that depend on this one
    const impacted = new Set<string>();
    
    const traverse = (name: string) => {
      graph.links
        .filter((l: any) => l.target === name)
        .forEach((l: any) => {
          if (!impacted.has(l.source)) {
            impacted.add(l.source);
            traverse(l.source);
          }
        });
    };
    
    traverse(objectName);
    return Array.from(impacted);
  }
}
```

#### 4.2 Create Dependency Graph Component
```typescript
// src/frontend/src/components/DependencyGraph.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphData {
  nodes: Array<{ id: string; type: string; module: string }>;
  links: Array<{ source: string; target: string; type: string }>;
}

export function DependencyGraph({ data }: { data: GraphData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    const width = 800;
    const height = 600;
    
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);
    
    // Draw nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => getColorByType(d.type))
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text((d: any) => d.id)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
      
      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
    
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    function getColorByType(type: string) {
      const colors: any = {
        'FUNCTION': '#4CAF50',
        'REPORT': '#2196F3',
        'CLASS': '#FF9800',
        'INCLUDE': '#9C27B0'
      };
      return colors[type] || '#757575';
    }
  }, [data]);
  
  return (
    <div className="dependency-graph">
      <h3>Dependency Graph</h3>
      <svg ref={svgRef}></svg>
      <div className="legend">
        <div><span style={{color: '#4CAF50'}}>●</span> Function</div>
        <div><span style={{color: '#2196F3'}}>●</span> Report</div>
        <div><span style={{color: '#FF9800'}}>●</span> Class</div>
        <div><span style={{color: '#9C27B0'}}>●</span> Include</div>
      </div>
    </div>
  );
}
```

---

### Day 5: Redundancy Detection & Dashboard

#### 5.1 Create Redundancy Detector
```typescript
// src/backend/services/redundancyDetector.ts
import { OpenAI } from 'openai';

export class RedundancyDetector {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  async findDuplicates(files: ABAPFile[]) {
    const redundancies: Redundancy[] = [];
    
    // Generate embeddings for all files
    const embeddings = await Promise.all(
      files.map(async f => ({
        file: f,
        embedding: await this.getEmbedding(f.content)
      }))
    );
    
    // Compare all pairs
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = this.cosineSimilarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );
        
        if (similarity > 0.85) {
          redundancies.push({
            file1: embeddings[i].file.name,
            file2: embeddings[j].file.name,
            similarity,
            recommendation: await this.generateRecommendation(
              embeddings[i].file,
              embeddings[j].file,
              similarity
            )
          });
        }
      }
    }
    
    return redundancies.sort((a, b) => b.similarity - a.similarity);
  }
  
  private async getEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  private async generateRecommendation(
    file1: ABAPFile,
    file2: ABAPFile,
    similarity: number
  ): Promise<string> {
    const prompt = `
These two ABAP files are ${(similarity * 100).toFixed(1)}% similar:

File 1: ${file1.name}
${file1.content.substring(0, 500)}

File 2: ${file2.name}
${file2.content.substring(0, 500)}

Provide a brief recommendation on how to consolidate them.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });
    
    return response.choices[0].message.content || '';
  }
}
```

#### 5.2 Create Intelligence Dashboard
```typescript
// src/frontend/src/pages/IntelligenceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { QAInterface } from '../components/QAInterface';
import { DependencyGraph } from '../components/DependencyGraph';
import ReactMarkdown from 'react-markdown';

export function IntelligenceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [redundancies, setRedundancies] = useState<any[]>([]);
  
  useEffect(() => {
    loadStats();
    loadGraphData();
    loadRedundancies();
  }, []);
  
  const loadStats = async () => {
    const response = await fetch('/api/intelligence/stats');
    const data = await response.json();
    setStats(data);
  };
  
  const loadGraphData = async () => {
    const response = await fetch('/api/intelligence/dependency-graph');
    const data = await response.json();
    setGraphData(data);
  };
  
  const loadRedundancies = async () => {
    const response = await fetch('/api/intelligence/redundancies');
    const data = await response.json();
    setRedundancies(data);
  };
  
  return (
    <div className="intelligence-dashboard">
      <h1>Custom Code Intelligence</h1>
      
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Files</h3>
          <div className="stat-value">{stats?.totalFiles || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Lines of Code</h3>
          <div className="stat-value">{stats?.totalLines || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Modules</h3>
          <div className="stat-value">{stats?.modules || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Redundancies Found</h3>
          <div className="stat-value">{redundancies.length}</div>
        </div>
      </div>
      
      {/* Q&A Interface */}
      <section className="qa-section">
        <QAInterface />
      </section>
      
      {/* Dependency Graph */}
      <section className="graph-section">
        {graphData && <DependencyGraph data={graphData} />}
      </section>
      
      {/* Redundancy Report */}
      <section className="redundancy-section">
        <h2>Redundant Code Detected</h2>
        {redundancies.map((r, i) => (
          <div key={i} className="redundancy-card">
            <h4>
              {r.file1} ↔ {r.file2}
              <span className="similarity">
                {(r.similarity * 100).toFixed(1)}% similar
              </span>
            </h4>
            <p>{r.recommendation}</p>
          </div>
        ))}
      </section>
      
      {/* Documentation Browser */}
      <section className="docs-section">
        <h2>Code Documentation</h2>
        <div className="docs-browser">
          <div className="file-list">
            {stats?.files?.map((file: any) => (
              <div
                key={file.id}
                className="file-item"
                onClick={() => setSelectedFile(file)}
              >
                {file.name}
              </div>
            ))}
          </div>
          <div className="doc-viewer">
            {selectedFile && (
              <ReactMarkdown>{selectedFile.documentation}</ReactMarkdown>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## Database Schema

```sql
-- ABAP files
CREATE TABLE abap_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50),
  module VARCHAR(10),
  lines_of_code INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results
CREATE TABLE abap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES abap_files(id) ON DELETE CASCADE,
  objects JSONB,
  dependencies JSONB,
  business_logic JSONB,
  complexity INTEGER,
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Documentation
CREATE TABLE documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES abap_files(id) ON DELETE CASCADE,
  markdown TEXT NOT NULL,
  metadata JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Redundancies
CREATE TABLE redundancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file1_id UUID REFERENCES abap_files(id),
  file2_id UUID REFERENCES abap_files(id),
  similarity DECIMAL(3,2),
  recommendation TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_abap_files_module ON abap_files(module);
CREATE INDEX idx_abap_files_type ON abap_files(type);
CREATE INDEX idx_documentation_file_id ON documentation(file_id);
```

---

## Environment Variables

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/sap_intelligence
REDIS_URL=redis://localhost:6379

# OpenAI for embeddings and chat
OPENAI_API_KEY=sk-...

# Pinecone for vector search
PINECONE_API_KEY=...

# Optional: Claude API if using directly
ANTHROPIC_API_KEY=...
```

---

## API Endpoints

```typescript
// Intelligence endpoints
POST   /api/intelligence/upload           // Upload ABAP files
POST   /api/intelligence/generate-docs    // Generate documentation
POST   /api/intelligence/qa               // Ask questions
GET    /api/intelligence/stats            // Get statistics
GET    /api/intelligence/dependency-graph // Get dependency graph
GET    /api/intelligence/redundancies     // Get redundancy report
GET    /api/intelligence/docs/:fileId     // Get documentation for file
POST   /api/intelligence/search           // Semantic search
```

---

## Testing Plan

### Unit Tests
```typescript
// tests/documentationGenerator.test.ts
describe('DocumentationGenerator', () => {
  it('should generate markdown documentation', async () => {
    const analysis = {
      name: 'Z_CALCULATE_PRICE',
      type: 'FUNCTION',
      module: 'SD',
      businessLogic: [...]
    };
    
    const docs = await docGen.generateDocumentation(analysis);
    
    expect(docs).toContain('## Overview');
    expect(docs).toContain('## Business Logic');
  });
});

// tests/vectorSearch.test.ts
describe('VectorSearchService', () => {
  it('should find relevant code', async () => {
    await vectorSearch.indexCode('test-1', 'ABAP code...', 'docs...', {});
    
    const results = await vectorSearch.search('pricing calculation');
    
    expect(results.length).toBeGreaterThan(0);
  });
});
```

---

## Success Metrics

### Technical
- ✅ Parse 1,000+ ABAP files
- ✅ Generate docs in < 30 seconds
- ✅ Q&A response time < 3 seconds
- ✅ 90%+ search relevance

### User Experience
- ✅ Intuitive dashboard
- ✅ Fast search
- ✅ Clear visualizations
- ✅ Actionable insights

---

## Next Steps

1. **Day 1:** Setup + Documentation Generator
2. **Day 2:** Vector Search + Indexing
3. **Day 3:** Q&A Interface (RAG)
4. **Day 4:** Dependency Graph
5. **Day 5:** Redundancy Detection + Dashboard

**Total Time:** 5 days for complete Custom Code Intelligence!

---

**Combined with AI Build (already 80% done), you'll have a powerful SAP modernization platform!** 🚀
