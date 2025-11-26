# Design Document: MCP Integration for Resurrection Platform

## Overview

This document defines the technical architecture for integrating all 5 MCP servers into the Resurrection Platform to create a fully automated ABAP-to-CAP transformation workflow.

**Goal:** Build an open-source alternative to SAP Nova AI using proven MCP servers and Kiro AI orchestration.

**Status:** All 5 MCP servers tested and working ✅

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Platform                         │
│                  (Next.js + Node.js + React)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Kiro AI Orchestrator                        │
│              (Coordinates all MCP server calls)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ ABAP Analyzer│    │   SAP CAP    │      │   SAP UI5    │
│     MCP      │    │     MCP      │      │     MCP      │
│   (Python)   │    │  (Node.js)   │      │  (Node.js)   │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│  GitHub MCP  │    │   Slack MCP  │      │  Generated   │
│   (Python)   │    │   (Python)   │      │  CAP Project │
└──────────────┘    └──────────────┘      └──────────────┘
```

### Technology Stack

**Platform:**
- Frontend: Next.js 14, React 18, TypeScript, Shadcn UI, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL (Supabase) for metadata
- Vector DB: Pinecone for semantic search
- Authentication: NextAuth.js

**MCP Servers (All Working ✅):**
1. ABAP Analyzer MCP (Custom Python)
2. SAP CAP MCP (@cap-js/mcp-server)
3. SAP UI5 MCP (@ui5/mcp-server)
4. GitHub MCP (mcp-server-github)
5. Slack MCP (slack-mcp-server)


## Components and Interfaces

### 1. MCP Client Service

**Purpose:** Manages connections to all 5 MCP servers

**Location:** `resurrection-platform/lib/mcp/mcp-client.ts`

**Interface:**
```typescript
interface MCPClient {
  // ABAP Analyzer MCP
  analyzeABAP(code: string): Promise<ABAPAnalysis>;
  
  // SAP CAP MCP (via Kiro)
  searchCAPModel(query: string): Promise<CAPModel[]>;
  searchCAPDocs(query: string): Promise<CAPDocumentation[]>;
  
  // SAP UI5 MCP (via Kiro)
  createUI5App(config: UI5AppConfig): Promise<UI5Project>;
  lintUI5Project(projectPath: string): Promise<LintResults>;
  getUI5APIReference(query: string): Promise<UI5APIDoc>;
  
  // GitHub MCP
  createRepository(name: string, description: string): Promise<GitHubRepo>;
  commitFiles(repo: string, files: FileMap): Promise<CommitResult>;
  
  // Slack MCP
  postMessage(channel: string, message: string): Promise<SlackResponse>;
}
```

**Key Methods:**
- `initializeConnections()` - Start all MCP servers
- `healthCheck()` - Verify all servers are responsive
- `callMCP(server, tool, params)` - Generic MCP call wrapper
- `handleError(server, error)` - Error handling with fallbacks


### 2. Resurrection Workflow Engine

**Purpose:** Orchestrates the 5-step transformation workflow

**Location:** `resurrection-platform/lib/workflow/resurrection-engine.ts`

**Workflow Steps:**

```typescript
class ResurrectionEngine {
  async execute(abapCode: string, config: ResurrectionConfig): Promise<Resurrection> {
    // Step 1: Analyze ABAP
    const analysis = await this.analyzeStep(abapCode);
    
    // Step 2: Plan Transformation
    const plan = await this.planStep(analysis);
    
    // Step 3: Generate CAP Project
    const project = await this.generateStep(plan);
    
    // Step 4: Validate Output
    const validation = await this.validateStep(project);
    
    // Step 5: Deploy to GitHub
    const deployment = await this.deployStep(project);
    
    return { analysis, plan, project, validation, deployment };
  }
}
```

**Step Details:**

**Step 1: Analyze (ABAP Analyzer MCP)**
- Input: Raw ABAP code
- MCP Call: `analyzeCode(code)`
- Output: Business logic, tables, patterns, complexity, documentation
- Duration: ~2-5 seconds

**Step 2: Plan (Kiro AI + CAP MCP)**
- Input: ABAP analysis
- MCP Calls: `searchCAPDocs("entity definition")`, `searchCAPModel("service")`
- AI Processing: Create transformation plan with CDS models
- Output: Transformation plan with entity definitions, service structure
- Duration: ~10-20 seconds

**Step 3: Generate (CAP MCP + UI5 MCP + cds init)**
- Input: Transformation plan
- MCP Calls: 
  - `searchCAPDocs("best practices")`
  - `createUI5App({ namespace, type: "Fiori Elements" })`
- CLI: `cds init` for project structure
- Output: Complete CAP project with CDS, services, UI, mta.yaml
- Duration: ~15-30 seconds

**Step 4: Validate (Kiro Hooks + UI5 MCP)**
- Input: Generated project
- MCP Calls: `lintUI5Project(projectPath)`
- Validation: CDS syntax, CAP structure, Clean Core compliance
- Output: Validation report with errors/warnings
- Duration: ~5-10 seconds

**Step 5: Deploy (GitHub MCP + Slack MCP)**
- Input: Validated project
- MCP Calls:
  - `createRepository(name, description)`
  - `commitFiles(repo, files)`
  - `postMessage(channel, "✅ Resurrection complete")`
- Output: GitHub repo URL, Slack notification
- Duration: ~10-15 seconds

**Total Duration: ~45-80 seconds per resurrection**


### 3. Mock Data Generator

**Purpose:** Generate realistic CSV data for db/data/ folder

**Location:** `resurrection-platform/lib/generators/mock-data-generator.ts`

**Strategy:**
```typescript
class MockDataGenerator {
  async generateForEntities(entities: CDS Entity[]): Promise<CSVFiles> {
    const csvFiles = {};
    
    for (const entity of entities) {
      // Generate 10-50 records per entity
      const records = await this.generateRecords(entity, 25);
      
      // Ensure referential integrity
      const validRecords = this.ensureIntegrity(records, entities);
      
      // Convert to CSV
      csvFiles[`${entity.name}.csv`] = this.toCSV(validRecords);
    }
    
    return csvFiles;
  }
  
  private generateRecords(entity: CDS Entity, count: number): Record[] {
    // Use faker.js for realistic data
    // Match ABAP data types to appropriate faker methods
    // Handle associations and compositions
  }
}
```

**Data Generation Rules:**
- Use faker.js for realistic names, dates, amounts
- Match ABAP types: TYPE p → Decimal, TYPE d → Date, TYPE c → String
- Preserve business logic: If ABAP has credit limit checks, generate data that tests limits
- Referential integrity: Foreign keys must reference existing records
- 10-50 records per entity (configurable)

**Example Output:**
```csv
# db/data/com.example-SalesOrders.csv
ID,customer,orderDate,totalAmount,status
1,CUST001,2024-01-15,1250.00,COMPLETED
2,CUST002,2024-01-16,3400.50,PENDING
```


## Data Models

### Resurrection Metadata

**Database Schema (PostgreSQL):**

```sql
-- Resurrections table
CREATE TABLE resurrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'analyzing', 'planning', 'generating', 'validating', 'deploying', 'completed', 'failed'
  abap_code TEXT NOT NULL,
  abap_analysis JSONB,
  transformation_plan JSONB,
  github_repo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_by VARCHAR(255),
  module VARCHAR(10), -- 'SD', 'MM', 'FI', 'CUSTOM'
  complexity INTEGER, -- 1-10
  lines_of_code INTEGER
);

-- Workflow steps tracking
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resurrection_id UUID REFERENCES resurrections(id),
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  output JSONB,
  error TEXT
);

-- MCP call logs
CREATE TABLE mcp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resurrection_id UUID REFERENCES resurrections(id),
  server_name VARCHAR(100) NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  params JSONB,
  response JSONB,
  error TEXT,
  duration_ms INTEGER,
  called_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
interface Resurrection {
  id: string;
  name: string;
  status: ResurrectionStatus;
  abapCode: string;
  abapAnalysis?: ABAPAnalysis;
  transformationPlan?: TransformationPlan;
  githubRepoUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  module: 'SD' | 'MM' | 'FI' | 'CUSTOM';
  complexity: number;
  linesOfCode: number;
}

interface ABAPAnalysis {
  businessLogic: string[];
  tables: string[];
  dependencies: string[];
  patterns: string[];
  metadata: {
    module: string;
    complexity: number;
    linesOfCode: number;
  };
  documentation: string;
}

interface TransformationPlan {
  entities: CDSEntity[];
  services: CDSService[];
  ui: UIConfig;
  mockData: MockDataConfig;
}

interface CDSEntity {
  name: string;
  fields: CDSField[];
  associations: CDSAssociation[];
  annotations: Record<string, any>;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ABAP Analysis Completeness
*For any* valid ABAP code, the ABAP Analyzer MCP should extract at least one of: business logic patterns, database tables, or SAP patterns
**Validates: Requirements 2.1, 5.3**

### Property 2: MCP Server Health
*For any* resurrection workflow execution, all required MCP servers (ABAP Analyzer, GitHub, Slack) should be reachable before starting
**Validates: Requirements 4.5, 4.6**

### Property 3: Workflow Step Ordering
*For any* resurrection, workflow steps should execute in order: Analyze → Plan → Generate → Validate → Deploy, and no step should start before the previous completes
**Validates: Requirements 3.1, 3.7**

### Property 4: GitHub Repository Creation
*For any* completed resurrection, if GitHub MCP is used, a repository should be created with a valid URL
**Validates: Requirements 10.2, 10.3**

### Property 5: Mock Data Referential Integrity
*For any* generated mock data, all foreign key references should point to existing records in related entities
**Validates: Requirements 16.4**

### Property 6: CAP Project Structure
*For any* generated CAP project, the folder structure should include db/, srv/, app/, package.json, and mta.yaml
**Validates: Requirements 12.1, 12.5, 12.6**

### Property 7: Slack Notification Delivery
*For any* resurrection that completes (success or failure), a Slack notification should be sent if Slack MCP is configured
**Validates: Requirements 3.10, 8.10**

### Property 8: Error Recovery
*For any* MCP server failure, the workflow should either retry (up to 3 times) or provide a clear error message with fallback options
**Validates: Requirements 9.8, 9.9**

### Property 9: ABAP Business Logic Preservation
*For any* ABAP code with pricing calculations, the generated CDS model should preserve the calculation logic in service handlers
**Validates: Requirements 9.7**

### Property 10: UI5 Linting Pass
*For any* generated UI5 application, running the UI5 linter should return zero critical errors
**Validates: Requirements 4.4**


## Error Handling

### MCP Server Error Handling

**Strategy: Retry with Exponential Backoff + Fallbacks**

```typescript
class MCPErrorHandler {
  async callWithRetry(
    server: string,
    tool: string,
    params: any,
    maxRetries = 3
  ): Promise<any> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.mcpClient.call(server, tool, params);
      } catch (error) {
        lastError = error;
        
        // Log error
        await this.logError(server, tool, error, attempt);
        
        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }
    
    // All retries failed - use fallback
    return await this.useFallback(server, tool, params, lastError);
  }
  
  private async useFallback(server: string, tool: string, params: any, error: Error) {
    switch (server) {
      case 'sap-cap':
        // Fallback: Use cds init without MCP guidance
        return await this.fallbackCAPGeneration(params);
        
      case 'sap-ui5':
        // Fallback: Use basic Fiori Elements template
        return await this.fallbackUI5Generation(params);
        
      case 'github':
        // Fallback: Offer .zip download for manual git push
        return await this.fallbackGitHubExport(params);
        
      case 'slack':
        // Fallback: Log notification locally, don't block workflow
        return await this.fallbackSlackLog(params);
        
      case 'abap-analyzer':
        // No fallback - this is critical, must fail
        throw new Error(`ABAP Analyzer MCP failed: ${error.message}`);
        
      default:
        throw error;
    }
  }
}
```

### Error Types and Responses

| Error Type | MCP Server | Response | User Message |
|------------|------------|----------|--------------|
| Connection Timeout | Any | Retry 3x | "MCP server not responding. Retrying..." |
| Invalid Response | Any | Retry 3x | "Invalid response from MCP. Retrying..." |
| Tool Not Found | CAP/UI5 | Use fallback | "Using fallback generation method" |
| Authentication Failed | GitHub/Slack | Show error | "Check GITHUB_TOKEN / SLACK_BOT_TOKEN" |
| ABAP Parse Error | ABAP Analyzer | Fail workflow | "Invalid ABAP code at line X" |
| Rate Limit | GitHub | Wait + retry | "GitHub rate limit. Waiting 60s..." |


## Testing Strategy

### Unit Tests

**Test Framework:** Jest + TypeScript

**Test Coverage:**

1. **MCP Client Tests** (`lib/mcp/mcp-client.test.ts`)
   - Test connection initialization
   - Test each MCP tool call
   - Test error handling
   - Mock MCP responses

2. **Workflow Engine Tests** (`lib/workflow/resurrection-engine.test.ts`)
   - Test each workflow step independently
   - Test step ordering
   - Test error propagation
   - Mock MCP client

3. **Mock Data Generator Tests** (`lib/generators/mock-data-generator.test.ts`)
   - Test data generation for various entity types
   - Test referential integrity
   - Test CSV formatting

**Example Unit Test:**
```typescript
describe('MCPClient', () => {
  it('should analyze ABAP code successfully', async () => {
    const client = new MCPClient();
    const code = 'REPORT z_test.';
    
    const result = await client.analyzeABAP(code);
    
    expect(result).toHaveProperty('businessLogic');
    expect(result).toHaveProperty('tables');
    expect(result).toHaveProperty('metadata');
  });
  
  it('should retry on connection failure', async () => {
    const client = new MCPClient();
    // Mock connection failure
    jest.spyOn(client, 'call').mockRejectedValueOnce(new Error('Connection failed'));
    
    const result = await client.analyzeABAP('REPORT z_test.');
    
    // Should succeed on retry
    expect(result).toBeDefined();
  });
});
```

### Property-Based Tests

**Test Framework:** fast-check (JavaScript property testing library)

**Configuration:** Minimum 100 iterations per property

**Property Tests:**

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  it('Property 1: ABAP Analysis Completeness', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10 }), // Generate random ABAP-like code
        async (abapCode) => {
          const client = new MCPClient();
          const result = await client.analyzeABAP(abapCode);
          
          // At least one of these should be non-empty
          const hasData = 
            result.businessLogic.length > 0 ||
            result.tables.length > 0 ||
            result.patterns.length > 0;
          
          return hasData;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: mcp-integration, Property 3: Workflow Step Ordering**
  it('Property 3: Workflow Step Ordering', () => {
    fc.assert(
      fc.property(
        fc.string(), // Random ABAP code
        async (abapCode) => {
          const engine = new ResurrectionEngine();
          const steps: string[] = [];
          
          // Track step execution order
          engine.on('stepStart', (step) => steps.push(step));
          
          await engine.execute(abapCode, {});
          
          // Verify order
          return (
            steps[0] === 'analyze' &&
            steps[1] === 'plan' &&
            steps[2] === 'generate' &&
            steps[3] === 'validate' &&
            steps[4] === 'deploy'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // **Feature: mcp-integration, Property 5: Mock Data Referential Integrity**
  it('Property 5: Mock Data Referential Integrity', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ name: fc.string(), fields: fc.array(fc.string()) })),
        async (entities) => {
          const generator = new MockDataGenerator();
          const mockData = await generator.generateForEntities(entities);
          
          // Check all foreign keys reference existing records
          return generator.validateIntegrity(mockData);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

**Test End-to-End Workflow:**

```typescript
describe('Integration Tests', () => {
  it('should complete full resurrection workflow', async () => {
    // Use real MCP servers (in test mode)
    const engine = new ResurrectionEngine();
    
    const abapCode = `
      REPORT z_pricing.
      SELECT * FROM konv WHERE kschl = 'PR00'.
    `;
    
    const result = await engine.execute(abapCode, {
      name: 'test-resurrection',
      skipGitHub: true, // Don't create real repo
      skipSlack: true   // Don't send real notification
    });
    
    expect(result.analysis).toBeDefined();
    expect(result.plan).toBeDefined();
    expect(result.project).toBeDefined();
    expect(result.validation.errors).toHaveLength(0);
  });
});
```


## Implementation Details

### MCP Server Configuration

**Location:** `.kiro/settings/mcp.json`

**Current Configuration (All Working ✅):**

```json
{
  "mcpServers": {
    "abap-analyzer": {
      "command": "python",
      "args": [".kiro/mcp/abap-analyzer.py"],
      "disabled": false,
      "autoApprove": ["analyzeCode"]
    },
    "sap-cap": {
      "command": "npx",
      "args": ["-y", "@cap-js/mcp-server"],
      "disabled": false
    },
    "sap-ui5": {
      "command": "npx",
      "args": ["-y", "@ui5/mcp-server"],
      "disabled": false
    },
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "disabled": false,
      "autoApprove": ["create_repository", "create_or_update_file", "push_files"]
    },
    "slack": {
      "command": "uvx",
      "args": ["slack-mcp-server"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      },
      "disabled": false,
      "autoApprove": ["slack_post_message", "slack_list_channels"]
    }
  }
}
```

### Environment Variables

**Required in `.env.local`:**

```bash
# GitHub MCP
GITHUB_TOKEN=ghp_your_personal_access_token_here

# Slack MCP
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/resurrections

# Vector DB
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1

# Authentication
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### File Structure

```
resurrection-platform/
├── .kiro/
│   ├── settings/
│   │   └── mcp.json                    # MCP server configuration
│   └── mcp/
│       └── abap-analyzer.py            # Custom ABAP MCP server
├── app/
│   ├── api/
│   │   ├── resurrections/
│   │   │   ├── route.ts                # Create resurrection
│   │   │   └── [id]/
│   │   │       ├── route.ts            # Get resurrection status
│   │   │       └── steps/route.ts      # Get workflow steps
│   │   └── mcp/
│   │       ├── health/route.ts         # MCP health check
│   │       └── test/route.ts           # Test MCP servers
│   ├── resurrections/
│   │   ├── page.tsx                    # Resurrection dashboard
│   │   ├── new/page.tsx                # Upload ABAP wizard
│   │   └── [id]/page.tsx               # Resurrection details
│   └── layout.tsx
├── lib/
│   ├── mcp/
│   │   ├── mcp-client.ts               # MCP client service
│   │   ├── mcp-error-handler.ts        # Error handling
│   │   └── mcp-logger.ts               # MCP call logging
│   ├── workflow/
│   │   ├── resurrection-engine.ts      # Main workflow orchestrator
│   │   ├── steps/
│   │   │   ├── analyze-step.ts         # Step 1: ABAP Analysis
│   │   │   ├── plan-step.ts            # Step 2: Planning
│   │   │   ├── generate-step.ts        # Step 3: Generation
│   │   │   ├── validate-step.ts        # Step 4: Validation
│   │   │   └── deploy-step.ts          # Step 5: Deployment
│   │   └── workflow-types.ts
│   ├── generators/
│   │   ├── mock-data-generator.ts      # Mock data generation
│   │   ├── cap-generator.ts            # CAP project generation
│   │   └── ui5-generator.ts            # UI5 app generation
│   ├── db/
│   │   ├── schema.prisma               # Database schema
│   │   └── client.ts                   # Prisma client
│   └── utils/
│       ├── abap-parser.ts              # ABAP parsing utilities
│       └── sap-patterns.ts             # SAP pattern detection
├── components/
│   ├── resurrection/
│   │   ├── workflow-progress.tsx       # Live workflow progress
│   │   ├── abap-upload.tsx             # ABAP upload component
│   │   └── resurrection-card.tsx       # Resurrection summary card
│   └── ui/                             # Shadcn UI components
├── __tests__/
│   ├── unit/
│   │   ├── mcp-client.test.ts
│   │   ├── resurrection-engine.test.ts
│   │   └── mock-data-generator.test.ts
│   ├── integration/
│   │   └── full-workflow.test.ts
│   └── property/
│       └── correctness-properties.test.ts
└── package.json
```


## Key Design Decisions

### 1. Why Use All 5 MCP Servers?

**Decision:** Use all 5 MCP servers instead of direct APIs or CLI tools

**Rationale:**
- **Consistency:** Single protocol (MCP) for all external services
- **Proven:** All 5 servers tested and working
- **AI-Friendly:** MCP designed for AI agent interaction
- **Future-Proof:** Easy to add more MCP servers later
- **Observability:** Centralized logging of all MCP calls

**Trade-offs:**
- More complex than direct APIs
- Requires MCP server management
- Dependency on external packages

**Mitigation:**
- Implement fallbacks for non-critical servers (CAP, UI5, Slack)
- Comprehensive error handling
- Health checks before workflow execution

### 2. Workflow Orchestration Strategy

**Decision:** Sequential workflow with streaming progress updates

**Rationale:**
- **Transparency:** Users see each step as it happens
- **Debugging:** Easy to identify which step failed
- **User Control:** Can pause/retry individual steps
- **Simplicity:** Easier to implement than parallel execution

**Alternative Considered:** Parallel execution of independent steps
**Why Rejected:** Steps have dependencies (can't generate before analyzing)

### 3. Mock Data Generation Approach

**Decision:** Generate mock data automatically based on CDS entities

**Rationale:**
- **User Experience:** Generated apps look good immediately
- **Testing:** Provides data for local testing
- **Demonstration:** Shows functionality without manual data entry

**Implementation:**
- Use faker.js for realistic data
- Match ABAP data types to appropriate generators
- Ensure referential integrity
- 10-50 records per entity (configurable)

### 4. Error Handling Philosophy

**Decision:** Retry + Fallback + Clear Error Messages

**Rationale:**
- **Resilience:** Temporary failures don't break workflow
- **User Experience:** Clear guidance on what went wrong
- **Flexibility:** Fallbacks allow workflow to continue

**Critical vs Non-Critical:**
- **Critical (must succeed):** ABAP Analyzer
- **Non-Critical (can fallback):** CAP MCP, UI5 MCP, GitHub MCP, Slack MCP

### 5. Database Choice

**Decision:** PostgreSQL (via Supabase) for metadata

**Rationale:**
- **Relational:** Good fit for structured resurrection metadata
- **JSON Support:** JSONB for flexible storage of analysis/plans
- **Supabase:** Managed service with auth, real-time, storage
- **Scalability:** Can handle thousands of resurrections

**Alternative Considered:** MongoDB
**Why Rejected:** Relational structure fits better, need ACID guarantees


## Performance Considerations

### Expected Performance

| Operation | Duration | Bottleneck |
|-----------|----------|------------|
| ABAP Analysis | 2-5s | ABAP Analyzer MCP parsing |
| Transformation Planning | 10-20s | Kiro AI + CAP MCP docs search |
| CAP Generation | 15-30s | File generation + cds init |
| UI5 Generation | 10-15s | UI5 MCP app creation |
| Validation | 5-10s | UI5 linting |
| GitHub Deployment | 10-15s | GitHub MCP file commits |
| **Total** | **45-80s** | **End-to-end resurrection** |

### Optimization Strategies

**1. Caching**
- Cache CAP MCP documentation searches (1 hour TTL)
- Cache UI5 API reference lookups (1 hour TTL)
- Cache ABAP analysis for identical code

**2. Parallel Execution (Where Possible)**
- Generate mock data while generating UI5 app
- Validate CDS and UI5 in parallel
- Commit files to GitHub in batches

**3. Streaming**
- Stream MCP responses to UI in real-time
- Show progress indicators for each step
- Update database incrementally

**4. Resource Management**
- Limit concurrent resurrections (max 5)
- Queue additional requests
- Use connection pooling for MCP servers

### Scalability

**Current Capacity:**
- 5 concurrent resurrections
- ~45-80s per resurrection
- ~225-400 resurrections/hour (with 5 workers)

**Scaling Strategy:**
- Horizontal: Add more worker processes
- Vertical: Increase MCP server resources
- Queue: Use Bull/BullMQ for job queue
- Database: Connection pooling, read replicas


## Security Considerations

### Authentication & Authorization

**Platform Access:**
- NextAuth.js for user authentication
- OAuth providers: GitHub, Google, Microsoft
- JWT tokens for API access
- Role-based access control (RBAC)

**MCP Server Security:**
- Environment variables for sensitive tokens
- Never expose tokens in logs or UI
- Rotate tokens regularly
- Use least-privilege access

### Data Security

**ABAP Code:**
- Encrypt at rest in database
- Encrypt in transit (HTTPS)
- Access control: Users can only see their resurrections
- Option to delete ABAP code after transformation

**Generated Code:**
- Store in private GitHub repos by default
- Option for public repos (user choice)
- Include .gitignore to exclude sensitive files

### MCP Server Isolation

**Sandboxing:**
- MCP servers run in separate processes
- Limited file system access
- No network access except to configured endpoints
- Resource limits (CPU, memory, timeout)

### Audit Logging

**Log All Actions:**
- User authentication events
- Resurrection creation/deletion
- MCP server calls
- GitHub repo creation
- Slack notifications

**Retention:**
- Keep logs for 90 days
- Archive for compliance if needed


## Deployment Strategy

### Development Environment

```bash
# Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 14+
- uv (Python package manager)

# Setup
npm install
npm run db:migrate
npm run dev

# MCP Servers (auto-started by Kiro)
# Configured in .kiro/settings/mcp.json
```

### Production Deployment

**Platform:** Vercel (Next.js) + Supabase (Database)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Next.js App (Serverless Functions)          │   │
│  │  - API Routes                                        │   │
│  │  - Resurrection Workflow Engine                     │   │
│  │  - MCP Client                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  - PostgreSQL Database                                       │
│  - Authentication                                            │
│  - Real-time Subscriptions                                  │
│  - Storage (for ABAP files)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  - GitHub (via GitHub MCP)                                   │
│  - Slack (via Slack MCP)                                     │
│  - Pinecone (Vector DB)                                      │
└─────────────────────────────────────────────────────────────┘
```

**MCP Servers in Production:**
- Run as serverless functions (Vercel)
- Or run as separate services (Docker containers)
- Health checks every 5 minutes
- Auto-restart on failure

**Environment Variables (Vercel):**
```bash
GITHUB_TOKEN=***
SLACK_BOT_TOKEN=***
DATABASE_URL=***
PINECONE_API_KEY=***
NEXTAUTH_SECRET=***
```

### Monitoring

**Metrics to Track:**
- Resurrection success rate
- Average resurrection duration
- MCP server response times
- Error rates by MCP server
- User activity

**Tools:**
- Vercel Analytics
- Sentry (error tracking)
- Custom dashboard (resurrection metrics)

### Backup & Recovery

**Database Backups:**
- Supabase automatic daily backups
- Point-in-time recovery (7 days)

**Code Backups:**
- GitHub repos (generated code)
- Git history (platform code)

**Disaster Recovery:**
- RTO: 1 hour (restore from backup)
- RPO: 24 hours (daily backups)


## Success Criteria

### Technical Success

✅ **All 5 MCP Servers Working**
- ABAP Analyzer MCP: Parses ABAP code
- SAP CAP MCP: Provides CAP patterns and docs
- SAP UI5 MCP: Creates UI5 apps and linting
- GitHub MCP: Creates repos and commits files
- Slack MCP: Sends notifications

✅ **End-to-End Workflow**
- Upload ABAP → Analyze → Plan → Generate → Validate → Deploy
- Complete in 45-80 seconds
- Success rate > 90%

✅ **Generated CAP Projects**
- Valid CDS syntax
- Complete folder structure (db/, srv/, app/)
- Deployable to SAP BTP
- Includes mock data

✅ **Error Handling**
- Retry on transient failures
- Fallbacks for non-critical services
- Clear error messages

### Business Success

**Metrics:**
- 100+ resurrections created (first month)
- 75%+ user satisfaction
- 50%+ cost reduction vs manual transformation
- 10+ GitHub stars

**User Feedback:**
- "Faster than manual transformation"
- "Generated code is high quality"
- "Easy to use"
- "Saves time and money"

### Competitive Positioning

**vs SAP Nova AI:**
- ✅ Open source (vs proprietary)
- ✅ Free/affordable (vs expensive licensing)
- ✅ Transparent (vs black box)
- ✅ Customizable (vs locked-in)
- ✅ Community-driven (vs vendor-controlled)

**vs Manual Transformation:**
- ✅ 10x faster (45-80s vs hours/days)
- ✅ Consistent quality
- ✅ Automated testing
- ✅ Documentation included


## Implementation Roadmap

### Phase 1: Core MCP Integration (Week 1-2)

**Goal:** Get all MCP servers working in the workflow

**Tasks:**
1. Set up MCP Client Service
   - Initialize connections to all 5 servers
   - Implement health checks
   - Add error handling with retries

2. Implement ABAP Analysis Step
   - Call ABAP Analyzer MCP
   - Parse and store results
   - Display analysis in UI

3. Implement GitHub Deployment Step
   - Call GitHub MCP to create repo
   - Commit generated files
   - Return repo URL

4. Implement Slack Notifications
   - Call Slack MCP on workflow events
   - Send start/complete/error notifications

**Deliverable:** Basic workflow with ABAP → GitHub → Slack

### Phase 2: CAP & UI5 Generation (Week 3-4)

**Goal:** Generate complete CAP projects with UI5 apps

**Tasks:**
1. Implement Planning Step
   - Use Kiro AI to create transformation plan
   - Call CAP MCP for patterns and examples
   - Generate CDS entity definitions

2. Implement Generation Step
   - Use cds init for project structure
   - Call UI5 MCP to create Fiori app
   - Generate service handlers
   - Generate mock data

3. Implement Validation Step
   - Call UI5 MCP linter
   - Validate CDS syntax
   - Check Clean Core compliance

**Deliverable:** Full workflow generating deployable CAP projects

### Phase 3: UI & Polish (Week 5-6)

**Goal:** Professional UI with Halloween theme

**Tasks:**
1. Build Upload Wizard
   - Drag-and-drop ABAP upload
   - Real-time validation
   - Progress indicators

2. Build Resurrection Dashboard
   - List all resurrections
   - Filter by status/module
   - Show metrics

3. Build Workflow Progress View
   - Live streaming of workflow steps
   - Show MCP call logs
   - Display generated code preview

4. Apply Halloween Theme
   - Shadcn UI components
   - Dark theme with orange accents
   - Spooky animations

**Deliverable:** Production-ready platform with polished UI

### Phase 4: Testing & Deployment (Week 7-8)

**Goal:** Comprehensive testing and production deployment

**Tasks:**
1. Write Unit Tests
   - MCP Client
   - Workflow Engine
   - Mock Data Generator

2. Write Property-Based Tests
   - All 10 correctness properties
   - 100 iterations each

3. Write Integration Tests
   - End-to-end workflow
   - Error scenarios
   - Performance tests

4. Deploy to Production
   - Vercel deployment
   - Supabase setup
   - Environment variables
   - Monitoring

**Deliverable:** Tested, deployed, production-ready platform

### Phase 5: Documentation & Launch (Week 9-10)

**Goal:** Documentation and public launch

**Tasks:**
1. Write Documentation
   - User guide
   - Developer guide
   - API documentation
   - Deployment guide

2. Create Demo Video
   - Show full workflow
   - Highlight features
   - Compare to SAP Nova AI

3. Launch
   - GitHub repository public
   - Blog post
   - Social media
   - Product Hunt

**Deliverable:** Public launch with documentation


## Conclusion

### What We've Built

A comprehensive design for a fully MCP-powered ABAP-to-CAP transformation platform that:

✅ **Uses All 5 MCP Servers** (all tested and working)
- ABAP Analyzer MCP for parsing
- SAP CAP MCP for patterns and docs
- SAP UI5 MCP for app generation
- GitHub MCP for deployment
- Slack MCP for notifications

✅ **Implements 5-Step Workflow**
- Analyze → Plan → Generate → Validate → Deploy
- 45-80 seconds end-to-end
- Real-time progress streaming

✅ **Generates Complete CAP Projects**
- CDS models with business logic
- Service definitions and handlers
- Fiori UI5 applications
- Mock data for testing
- Deployment configs (mta.yaml)

✅ **Handles Errors Gracefully**
- Retry with exponential backoff
- Fallbacks for non-critical services
- Clear error messages

✅ **Includes Comprehensive Testing**
- Unit tests for all components
- Property-based tests for correctness
- Integration tests for workflow

### Why This Will Succeed

**Technical Excellence:**
- All MCP servers tested and working
- Proven architecture (Next.js + Supabase)
- Comprehensive error handling
- Automated testing

**Business Value:**
- 10x faster than manual transformation
- 50%+ cost reduction
- Open source (no licensing fees)
- Transparent and customizable

**Competitive Advantage:**
- Open alternative to SAP Nova AI
- Uses same SAP MCP servers (CAP, UI5)
- Community-driven development
- No vendor lock-in

### Next Steps

1. ✅ **Requirements Complete** - All MCP servers tested
2. ✅ **Design Complete** - This document
3. **Tasks Next** - Create implementation task list
4. **Implementation** - Build the platform (10 weeks)
5. **Launch** - Public release

**We have everything we need to build this platform successfully!** 🚀

All 5 MCP servers are working, the architecture is solid, and the design is comprehensive. Time to build!

