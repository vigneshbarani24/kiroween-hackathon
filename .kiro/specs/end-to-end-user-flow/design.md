# Design Document: SAP Nova AI Alternative - Resurrection Platform

## Overview

This design document outlines the technical architecture for the SAP Nova AI Alternative platform - a modern web application that analyzes legacy ABAP code and generates production-ready SAP CAP applications called "resurrections". The platform leverages MCP servers for intelligent transformation, GitHub for version control, and Slack for team collaboration.

### Key Design Principles

1. **Platform is NOT CAP** - Modern web stack (Next.js/Node.js/React) for flexibility and performance
2. **Resurrections ARE CAP** - Each output is a complete, deployable SAP CAP application
3. **MCP-Powered Intelligence** - Leverage specialized MCP servers for ABAP analysis and CAP generation
4. **Enterprise-Class UX** - Stellar user experience with smooth flows and professional design
5. **GitHub-First Workflow** - Every resurrection creates a GitHub repository (automated or manual)
6. **Automation via Hooks** - Use Kiro hooks for quality validation and CI/CD setup
7. **Flexible Deployment** - Platform can run on Vercel, AWS, or any Node.js environment

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Platform                         │
│                  (Next.js/Node.js/React)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (Next.js/React)                 │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Landing Page │  │ Intelligence │  │ Resurrection │    │ │
│  │  │ & Onboarding │  │ Dashboard    │  │ Wizard       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Q&A Chat     │  │ Resurrection │  │ Settings     │    │ │
│  │  │ Interface    │  │ Dashboard    │  │ & Admin      │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│  ┌────────────────────────────┼────────────────────────────────┐ │
│  │                    Backend (Node.js/Express)                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ REST/GraphQL │  │ MCP          │  │ Resurrection │    │ │
│  │  │ API          │  │ Orchestrator │  │ Engine       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Vector Search│  │ Hook Manager │  │ Auth Service │    │ │
│  │  │ (Pinecone)   │  │              │  │              │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               │                                   │
│  ┌────────────────────────────┼────────────────────────────────┐ │
│  │                    Database (PostgreSQL/MongoDB)             │ │
│  │  - ABAP Objects                                              │ │
│  │  - Resurrections                                             │ │
│  │  - Users & Auth                                              │ │
│  │  - Transformation Logs                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ MCP Protocol
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Servers (External)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ABAP Analyzer│  │ SAP CAP      │  │ SAP UI5      │          │
│  │ MCP Server   │  │ Generator    │  │ Generator    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ GitHub MCP   │  │ Slack MCP    │                            │
│  │ (Repo Mgmt)  │  │ (Notifications)                           │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Resurrection Output                           │
│                  (Complete CAP Application)                      │
│                                                                   │
│  📦 resurrection-sd-pricing-20241123/                           │
│  ├── db/                    (CDS schema, data)                  │
│  ├── srv/                   (CAP services, handlers)            │
│  ├── app/                   (Fiori UI)                          │
│  ├── mta.yaml               (BTP deployment descriptor)         │
│  ├── package.json           (Dependencies, scripts)             │
│  ├── xs-security.json       (XSUAA configuration)               │
│  ├── README.md              (Setup & deployment guide)          │
│  └── .github/workflows/     (CI/CD)                             │
│                                                                   │
│  🚀 Deployable to SAP BTP                                       │
│  🔗 GitHub Repository                                            │
│  💻 Open in SAP BAS                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router) or React 18+ with Vite
- TypeScript for type safety
- Tailwind CSS or SAP Horizon theme for styling
- Shadcn/ui or Material-UI for component library
- D3.js for dependency graph visualization
- React Query for data fetching and caching
- Zustand or Redux for state management

**Backend:**
- Node.js 18+ with Express or Next.js API routes
- TypeScript
- Prisma or TypeORM for database ORM
- PostgreSQL or MongoDB for data persistence
- Pinecone for vector search
- OpenAI API for embeddings and Q&A
- Bull or BullMQ for background job processing

**MCP Integration:**
- Model Context Protocol SDK
- Custom MCP client wrappers
- Streaming support for real-time progress
- Error handling and retry logic

**External Services:**
- GitHub API (via GitHub MCP)
- Slack API (via Slack MCP)
- OpenAI API (embeddings, chat completion)
- Pinecone (vector database)

**Deployment:**
- Vercel (recommended for Next.js)
- AWS (EC2, ECS, Lambda)
- Docker containers
- Environment variables for configuration


## Components and Interfaces

### 1. MCP Integration Layer

The platform connects to 5 MCP servers for specialized capabilities:

#### ABAP Analyzer MCP
**Purpose:** Parse and analyze legacy ABAP code with SAP domain knowledge

**Capabilities:**
- Syntax parsing and validation
- Business logic extraction
- Dependency analysis
- SAP pattern recognition (pricing, authorization, number ranges)
- Table usage identification

**Configuration:**
```json
{
  "mcpServers": {
    "abap-analyzer": {
      "command": "node",
      "args": ["./mcp-servers/abap-analyzer/index.js"],
      "env": {
        "SAP_DOMAIN_KNOWLEDGE": "enabled"
      }
    }
  }
}
```

**API Methods:**
- `analyzeCode(abapCode: string, context: object)` → Analysis result
- `extractBusinessLogic(abapCode: string)` → Business rules
- `findDependencies(abapCode: string)` → Dependency list
- `identifySAPPatterns(abapCode: string)` → Pattern matches

#### SAP CAP Generator MCP
**Purpose:** Generate modern CAP applications from ABAP business logic

**Capabilities:**
- CDS model generation from ABAP structures
- Service definition creation
- Event handler implementation
- Clean Core compliance validation

**API Methods:**
- `generateCDSModels(businessLogic: object)` → CDS files
- `generateServiceDefinitions(models: object)` → Service CDS
- `generateHandlers(services: object)` → JavaScript/TypeScript handlers
- `validateCleanCore(capProject: object)` → Validation report

#### SAP UI5 Generator MCP
**Purpose:** Generate Fiori Elements and Freestyle UI5 applications

**Capabilities:**
- Fiori Elements annotations
- UI5 component scaffolding
- Manifest.json generation
- Responsive design patterns

**API Methods:**
- `generateFioriElements(service: object, template: string)` → UI files
- `generateFreestyleUI5(requirements: object)` → UI5 components
- `generateManifest(appConfig: object)` → manifest.json

#### GitHub MCP
**Purpose:** Automate GitHub repository management

**Capabilities:**
- Repository creation with templates
- File commits and pushes
- Branch management
- Issue and PR creation
- GitHub Actions workflow setup
- Repository statistics

**API Methods:**
- `createRepository(name: string, options: object)` → Repo info
- `createOrUpdateFiles(repo: string, files: array)` → Commit info
- `createIssue(repo: string, issue: object)` → Issue info
- `createWorkflow(repo: string, workflow: object)` → Workflow file
- `addTopics(repo: string, topics: array)` → Success

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

#### Slack MCP
**Purpose:** Send team notifications and enable collaboration

**Capabilities:**
- Channel message posting
- Direct messages
- Interactive message buttons
- File uploads
- Thread conversations
- User mentions

**API Methods:**
- `postMessage(channel: string, text: string, options: object)` → Message info
- `postMessageWithAttachments(channel: string, message: object)` → Message info
- `createThread(channel: string, threadTs: string, text: string)` → Reply info
- `uploadFile(channel: string, file: buffer, filename: string)` → File info

**Configuration:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    }
  }
}
```

### 2. MCP Orchestration Service

**Purpose:** Manage MCP server lifecycle and coordinate transformation workflows

```typescript
// lib/mcp/orchestrator.ts
import { MCPClient } from './mcp-client';

export class MCPOrchestrator {
  private clients: Map<string, MCPClient>;
  
  constructor(config: MCPConfig) {
    this.clients = new Map();
    this.initializeClients(config);
  }
  
  async analyzeABAP(abapCode: string, context: object): Promise<AnalysisResult> {
    const client = this.clients.get('abap-analyzer');
    return await client.call('analyzeCode', { code: abapCode, context });
  }
  
  async generateCAP(businessLogic: object): Promise<CAPProject> {
    const capClient = this.clients.get('sap-cap-generator');
    const ui5Client = this.clients.get('sap-ui5-generator');
    
    // Generate CDS models
    const cdsModels = await capClient.call('generateCDSModels', { businessLogic });
    
    // Generate services
    const services = await capClient.call('generateServiceDefinitions', { models: cdsModels });
    
    // Generate handlers
    const handlers = await capClient.call('generateHandlers', { services });
    
    // Generate UI
    const ui = await ui5Client.call('generateFioriElements', { 
      service: services[0],
      template: 'list-report'
    });
    
    return {
      db: cdsModels,
      srv: { services, handlers },
      app: ui,
      packageJson: this.generatePackageJson(),
      mtaYaml: this.generateMTAYaml()
    };
  }
  
  async createGitHubRepo(resurrection: Resurrection): Promise<RepoInfo> {
    const githubClient = this.clients.get('github');
    
    // Create repository
    const repo = await githubClient.call('createRepository', {
      name: `resurrection-${resurrection.name}-${Date.now()}`,
      description: resurrection.description,
      auto_init: true,
      private: false
    });
    
    // Commit all files
    await githubClient.call('createOrUpdateFiles', {
      repo: repo.name,
      files: resurrection.files,
      message: '🔄 Resurrection: ABAP to CAP transformation complete'
    });
    
    // Add topics
    await githubClient.call('addTopics', {
      repo: repo.name,
      topics: ['sap-cap', 'abap-resurrection', 'clean-core', 'sap-btp']
    });
    
    // Setup CI/CD
    await githubClient.call('createWorkflow', {
      repo: repo.name,
      workflow: this.generateCIWorkflow()
    });
    
    return repo;
  }
  
  async notifySlack(channel: string, resurrection: Resurrection, event: string): Promise<void> {
    const slackClient = this.clients.get('slack');
    
    const messages = {
      'started': `🚀 Resurrection started: ${resurrection.name}`,
      'completed': `✅ Resurrection completed: ${resurrection.name}\n🔗 GitHub: ${resurrection.githubUrl}\n💻 Open in BAS: ${resurrection.basUrl}`,
      'failed': `🔴 Resurrection failed: ${resurrection.name}\n❌ Error: ${resurrection.error}`,
      'deployed': `🎉 Resurrection deployed: ${resurrection.name}\n🌐 Live URL: ${resurrection.deploymentUrl}`
    };
    
    await slackClient.call('postMessage', {
      channel,
      text: messages[event],
      attachments: [{
        color: event === 'failed' ? 'danger' : 'good',
        fields: [
          { title: 'Module', value: resurrection.module },
          { title: 'LOC Saved', value: resurrection.locSaved.toString() },
          { title: 'Quality Score', value: `${resurrection.qualityScore}%` }
        ]
      }]
    });
  }
}
```

### 3. Kiro Hooks Configuration

**Purpose:** Automate quality validation, testing, and notifications

**Hook Configuration File:** `.kiro/hooks/resurrection-hooks.json`

```json
{
  "hooks": [
    {
      "id": "on-resurrection-start",
      "name": "Notify team on resurrection start",
      "trigger": "resurrection.started",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "🚀 New resurrection: {{resurrection.name}}"
          }
        }
      ]
    },
    {
      "id": "on-resurrection-complete",
      "name": "Quality validation on completion",
      "trigger": "resurrection.completed",
      "enabled": true,
      "actions": [
        {
          "type": "agent-execution",
          "message": "Validate quality for resurrection {{resurrection.id}}: Check CDS syntax, CAP structure, Clean Core compliance"
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createIssue",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "title": "Quality Validation Results",
            "body": "{{quality_report}}",
            "labels": ["quality", "automated"]
          }
        }
      ]
    },
    {
      "id": "on-quality-failure",
      "name": "Alert on quality validation failure",
      "trigger": "quality.validation.failed",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "⚠️ Quality validation failed for {{resurrection.name}}",
            "attachments": [{
              "color": "danger",
              "title": "Validation Errors",
              "text": "{{validation_errors}}",
              "actions": [{
                "type": "button",
                "text": "View in GitHub",
                "url": "{{resurrection.githubUrl}}"
              }]
            }]
          }
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createIssue",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "title": "🔴 Quality Validation Failed",
            "body": "{{validation_errors}}",
            "labels": ["bug", "quality-failure"],
            "assignees": ["{{resurrection.owner}}"]
          }
        }
      ]
    },
    {
      "id": "on-deployment-success",
      "name": "Celebrate deployment success",
      "trigger": "deployment.succeeded",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "slack",
          "method": "postMessage",
          "params": {
            "channel": "#resurrections",
            "text": "🎉 Resurrection deployed successfully!",
            "attachments": [{
              "color": "good",
              "title": "{{resurrection.name}}",
              "fields": [
                { "title": "Application URL", "value": "{{deployment.url}}" },
                { "title": "GitHub Repo", "value": "{{resurrection.githubUrl}}" },
                { "title": "Lines of Code Saved", "value": "{{metrics.locSaved}}" }
              ]
            }]
          }
        },
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createRelease",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "tag_name": "v1.0.0",
            "name": "Production Release",
            "body": "Deployed to SAP BTP: {{deployment.url}}"
          }
        }
      ]
    },
    {
      "id": "setup-ci-cd",
      "name": "Configure GitHub Actions CI/CD",
      "trigger": "github.repository.created",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createOrUpdateFile",
          "params": {
            "repo": "{{resurrection.githubRepo}}",
            "path": ".github/workflows/ci.yml",
            "content": "{{ci_workflow_template}}"
          }
        }
      ]
    }
  ]
}
```

### 4. Resurrection CAP App Structure

**Complete CAP Project Generated for Each Resurrection:**

```
resurrection-sd-pricing-20241123/
├── db/
│   ├── schema.cds                 # CDS data models
│   ├── data/                      # Sample data (CSV files)
│   │   ├── SalesOrders.csv
│   │   └── Customers.csv
│   └── src/                       # Database procedures (optional)
├── srv/
│   ├── service.cds                # Service definitions
│   ├── service.js                 # Service implementation
│   └── handlers/                  # Business logic handlers
│       ├── pricing.js
│       └── validation.js
├── app/
│   ├── orders/                    # Fiori UI app
│   │   ├── webapp/
│   │   │   ├── manifest.json
│   │   │   ├── Component.js
│   │   │   └── annotations.cds    # Fiori Elements annotations
│   │   └── package.json
│   └── index.html                 # Launchpad
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD
├── mta.yaml                       # BTP deployment descriptor
├── package.json                   # Dependencies and scripts
├── xs-security.json               # XSUAA configuration
├── .gitignore
├── README.md                      # Setup and deployment guide
└── RESURRECTION.md                # Original ABAP context
```

**Key Files Generated:**

**package.json:**
```json
{
  "name": "resurrection-sd-pricing",
  "version": "1.0.0",
  "description": "Resurrected from ABAP: SD Pricing Logic",
  "scripts": {
    "start": "cds watch",
    "build": "cds build",
    "deploy": "cds deploy",
    "test": "jest"
  },
  "dependencies": {
    "@sap/cds": "^7.0.0",
    "@sap/xssec": "^3.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@sap/cds-dk": "^7.0.0",
    "jest": "^29.0.0"
  },
  "cds": {
    "requires": {
      "db": {
        "kind": "hana"
      },
      "auth": {
        "kind": "xsuaa"
      }
    }
  }
}
```

**mta.yaml:**
```yaml
_schema-version: '3.1'
ID: resurrection-sd-pricing
version: 1.0.0
description: Resurrected CAP application from ABAP

modules:
  - name: resurrection-sd-pricing-srv
    type: nodejs
    path: gen/srv
    requires:
      - name: resurrection-sd-pricing-db
      - name: resurrection-sd-pricing-xsuaa
    provides:
      - name: srv-api
        properties:
          srv-url: ${default-url}

  - name: resurrection-sd-pricing-db-deployer
    type: hdb
    path: gen/db
    requires:
      - name: resurrection-sd-pricing-db

  - name: resurrection-sd-pricing-app
    type: approuter.nodejs
    path: app
    requires:
      - name: srv-api
      - name: resurrection-sd-pricing-xsuaa

resources:
  - name: resurrection-sd-pricing-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared

  - name: resurrection-sd-pricing-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
```

**xs-security.json:**
```json
{
  "xsappname": "resurrection-sd-pricing",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.Admin",
      "description": "Administrator"
    },
    {
      "name": "$XSAPPNAME.User",
      "description": "User"
    }
  ],
  "role-templates": [
    {
      "name": "Admin",
      "description": "Administrator",
      "scope-references": ["$XSAPPNAME.Admin"]
    },
    {
      "name": "User",
      "description": "User",
      "scope-references": ["$XSAPPNAME.User"]
    }
  ]
}
```

**README.md (Generated):**
```markdown
# Resurrection: SD Pricing Logic

🔄 This CAP application was resurrected from legacy ABAP code.

## Original ABAP Context
- **Module:** SD (Sales & Distribution)
- **Functions:** Z_CALCULATE_DISCOUNT, Z_PRICING_PROCEDURE
- **Tables Used:** VBAK, VBAP, KONV
- **Transformation Date:** 2024-11-23

## Local Development

### Prerequisites
- Node.js 18+
- @sap/cds-dk

### Setup
\`\`\`bash
npm install
cds watch
\`\`\`

Access at: http://localhost:4004

## Deploy to SAP BTP

### Prerequisites
- Cloud Foundry CLI
- MTA Build Tool
- SAP BTP account

### Deployment
\`\`\`bash
# Login to Cloud Foundry
cf login -a https://api.cf.{region}.hana.ondemand.com

# Build MTA
mbt build

# Deploy
cf deploy mta_archives/resurrection-sd-pricing_1.0.0.mtar
\`\`\`

## Open in SAP Business Application Studio

[Open in BAS](https://bas.{region}.hana.ondemand.com/?gitClone=https://github.com/{org}/resurrection-sd-pricing-20241123)

## Architecture

- **Database:** SAP HANA Cloud (HDI Container)
- **Backend:** SAP CAP (Node.js)
- **Frontend:** SAP Fiori Elements
- **Authentication:** XSUAA

## Business Logic Preserved

All ABAP business logic has been preserved:
- Pricing calculations
- Discount rules
- Validation logic
- Authorization checks

See RESURRECTION.md for detailed transformation notes.
```


## Data Models

### Database Schema (PostgreSQL/MongoDB)

```typescript
// prisma/schema.prisma (if using Prisma)

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  githubUsername String?
  slackUserId   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  resurrections Resurrection[]
}

model ABAPObject {
  id              String   @id @default(uuid())
  name            String
  type            String   // FUNCTION, REPORT, CLASS, etc.
  module          String   // SD, MM, FI, etc.
  content         String   @db.Text
  linesOfCode     Int
  complexity      Int?
  
  // Analysis results
  documentation   String?  @db.Text
  businessLogic   Json?
  dependencies    Json?
  tables          Json?
  
  // Vector embedding for semantic search
  embeddingId     String?  // Reference to Pinecone vector
  
  // Relationships
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([module])
  @@index([type])
}

model Resurrection {
  id                String   @id @default(uuid())
  name              String
  description       String?
  status            String   // UPLOADED, ANALYZING, ANALYZED, TRANSFORMING, TRANSFORMED, DEPLOYED, FAILED
  module            String
  
  // GitHub integration
  githubRepo        String?
  githubUrl         String?
  githubMethod      String?  // MCP_AUTO, MANUAL_PUSH, USER_PROVIDED
  basUrl            String?
  
  // Deployment
  deploymentUrl     String?
  deploymentStatus  String?
  
  // Metrics
  originalLOC       Int?
  transformedLOC    Int?
  locSaved          Int?
  complexityScore   Float?
  qualityScore      Float?
  
  // Relationships
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  abapObjects       ABAPObject[]
  transformationLogs TransformationLog[]
  qualityReports    QualityReport[]
  hookExecutions    HookExecution[]
  slackNotifications SlackNotification[]
  githubActivities  GitHubActivity[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([status])
  @@index([userId])
  @@index([module])
}

model TransformationLog {
  id              String   @id @default(uuid())
  resurrectionId  String
  resurrection    Resurrection @relation(fields: [resurrectionId], references: [id])
  
  step            String   // PARSE_ABAP, GENERATE_CDS, GENERATE_UI, etc.
  mcpServer       String?
  request         Json?
  response        Json?
  duration        Int?     // milliseconds
  status          String   // STARTED, IN_PROGRESS, COMPLETED, FAILED
  errorMessage    String?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model QualityReport {
  id                      String   @id @default(uuid())
  resurrectionId          String
  resurrection            Resurrection @relation(fields: [resurrectionId], references: [id])
  
  overallScore            Float
  syntaxValid             Boolean
  cleanCoreCompliant      Boolean
  businessLogicPreserved  Boolean
  testCoverage            Float?
  issues                  Json?
  recommendations         Json?
  
  createdAt               DateTime @default(now())
  
  @@index([resurrectionId])
}

model HookExecution {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  hookId          String
  hookName        String
  trigger         String
  status          String   // TRIGGERED, RUNNING, COMPLETED, FAILED
  executionLog    Json?
  duration        Int?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
  @@index([hookId])
}

model SlackNotification {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  channel         String
  message         String   @db.Text
  messageTs       String?  // Slack message timestamp
  threadTs        String?  // For threaded replies
  status          String
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model GitHubActivity {
  id              String   @id @default(uuid())
  resurrectionId  String?
  resurrection    Resurrection? @relation(fields: [resurrectionId], references: [id])
  
  activity        String   // REPO_CREATED, COMMIT_PUSHED, ISSUE_CREATED, etc.
  details         Json?
  githubUrl       String?
  
  createdAt       DateTime @default(now())
  
  @@index([resurrectionId])
}

model Redundancy {
  id                  String   @id @default(uuid())
  object1Id           String
  object2Id           String
  similarity          Float
  recommendation      String?
  potentialSavings    Int?
  status              String   // DETECTED, REVIEWED, CONSOLIDATED, IGNORED
  
  createdAt           DateTime @default(now())
  
  @@index([object1Id])
  @@index([object2Id])
}

model FitToStandardRecommendation {
  id                    String   @id @default(uuid())
  abapObjectId          String
  standardAlternative   String   // BAPI name, transaction code
  confidence            Float
  description           String   @db.Text
  implementationGuide   String?  @db.Text
  potentialSavings      Int?
  status                String   // RECOMMENDED, ACCEPTED, REJECTED, IMPLEMENTED
  
  createdAt             DateTime @default(now())
  
  @@index([abapObjectId])
}
```

### API Endpoints

**REST API Structure:**

```typescript
// API Routes

// Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// ABAP Upload & Analysis
POST   /api/abap/upload              // Upload ABAP files
POST   /api/abap/analyze             // Trigger analysis
GET    /api/abap/objects             // List ABAP objects
GET    /api/abap/objects/:id         // Get object details
POST   /api/abap/search              // Semantic search

// Intelligence Dashboard
GET    /api/dashboard/metrics        // Get dashboard metrics
GET    /api/dashboard/dependencies   // Get dependency graph
GET    /api/dashboard/redundancies   // Get redundancy analysis
GET    /api/dashboard/fit-to-standard // Get fit-to-standard recommendations

// Q&A
POST   /api/qa/ask                   // Ask question
GET    /api/qa/suggestions           // Get suggested questions
GET    /api/qa/history               // Get Q&A history

// Resurrections
POST   /api/resurrections            // Create resurrection
GET    /api/resurrections            // List resurrections
GET    /api/resurrections/:id        // Get resurrection details
POST   /api/resurrections/:id/start  // Start transformation
POST   /api/resurrections/:id/github // Create GitHub repo
POST   /api/resurrections/:id/export // Export for manual push
GET    /api/resurrections/:id/status // Get transformation status

// MCP Management
GET    /api/mcp/servers              // List MCP servers
GET    /api/mcp/servers/:id/health   // Check MCP server health
POST   /api/mcp/servers/:id/test     // Test MCP server

// Hooks
GET    /api/hooks                    // List hooks
POST   /api/hooks/:id/trigger        // Manually trigger hook
GET    /api/hooks/executions         // Get hook execution history

// Admin
GET    /api/admin/stats              // Platform statistics
GET    /api/admin/users              // List users
POST   /api/admin/config             // Update configuration
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: MCP Invocation for ABAP Parsing
*For any* ABAP code upload, the ABAP Analyzer MCP server must be invoked and return a parseable response or clear error.
**Validates: Requirements 3.3**

### Property 2: Documentation and Embedding Generation
*For any* successfully parsed ABAP object, the system must generate both AI documentation (non-empty string) and vector embedding (1536 dimensions).
**Validates: Requirements 3.4**

### Property 3: Semantic Search Ranking
*For any* search query, results must be ranked by relevance score in descending order (highest relevance first).
**Validates: Requirements 4.5**

### Property 4: Q&A Response Structure
*For any* Q&A answer, the response must include a confidence level field (high/medium/low) and a sources array with at least one element when confidence is not low.
**Validates: Requirements 5.3**

### Property 5: CAP Package.json Completeness
*For any* generated CAP project, the package.json must include all required dependencies: @sap/cds, @sap/xssec, and express.
**Validates: Requirements 7.5**

### Property 6: Transformation Output Validation
*For any* completed transformation, validation must run and return a report with fields: syntaxValid, cleanCoreCompliant, businessLogicPreserved.
**Validates: Requirements 7.9**

### Property 7: GitHub Repository File Completeness
*For any* GitHub repository created via MCP, the repo must contain all required files: README.md, .gitignore, LICENSE, package.json, mta.yaml, and at least one CDS file.
**Validates: Requirements 8.2**

### Property 8: Git Commit Message Consistency
*For any* initial commit to a resurrection repository, the commit message must exactly match: "🔄 Resurrection: ABAP to CAP transformation complete".
**Validates: Requirements 8.3**

### Property 9: Hook Execution Guarantee
*For any* resurrection that reaches "TRANSFORMED" status, the "on-resurrection-complete" hook must be triggered and logged in HookExecutions table.
**Validates: Requirements 9.2**

### Property 10: CAP Folder Structure Completeness
*For any* generated resurrection CAP application, the folder structure must include: db/, srv/, app/, and files: mta.yaml, package.json, xs-security.json.
**Validates: Requirements 10.1**

### Property 11: CAP Build Validation
*For any* generated CAP application, running `npm install && cds build` must complete without errors (exit code 0).
**Validates: Requirements 10.10**

### Property 12: BAS Deep Link Format
*For any* resurrection with a GitHub repository, the generated BAS deep link must follow the format: `https://bas.{region}.hana.ondemand.com/?gitClone={repo_url}` and be a valid URL.
**Validates: Requirements 11.1**

### Property 13: Dashboard Data Completeness
*For any* dashboard load request, the response must include all resurrections for the authenticated user with fields: id, name, status, githubUrl, createdAt.
**Validates: Requirements 12.1**

## Error Handling

### Error Categories and Strategies

**1. MCP Server Errors**
- Connection failures
- Timeout errors
- Invalid responses
- Rate limiting

**Strategy:**
```typescript
async function callMCPWithRetry(server: string, method: string, params: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await mcpClient.call(server, method, params);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        await notifySlack('#platform-alerts', `🔴 ${server} MCP is offline`);
        throw new Error(`${server} service temporarily unavailable`);
      } else if (error.code === 'TIMEOUT' && attempt < maxRetries) {
        await sleep(1000 * attempt); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

**2. GitHub API Errors**
- Authentication failures
- Repository name conflicts
- Rate limiting
- Permission errors

**Strategy:**
```typescript
async function createGitHubRepoWithFallback(name: string) {
  try {
    return await githubMCP.createRepository({ name });
  } catch (error) {
    if (error.status === 422 && error.message.includes('already exists')) {
      const uniqueName = `${name}-${Date.now()}`;
      return await githubMCP.createRepository({ name: uniqueName });
    } else if (error.status === 403) {
      // Rate limit - wait and retry
      const resetTime = error.headers['x-ratelimit-reset'];
      await sleep(resetTime - Date.now());
      return await githubMCP.createRepository({ name });
    }
    throw error;
  }
}
```

**3. Database Errors**
- Connection failures
- Unique constraint violations
- Transaction conflicts

**Strategy:**
```typescript
async function saveResurrectionWithRetry(data: ResurrectionData) {
  try {
    return await prisma.resurrection.create({ data });
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint
      data.name = `${data.name}-${Date.now()}`;
      return await prisma.resurrection.create({ data });
    } else if (error.code === 'P1001') { // Connection error
      await prisma.$disconnect();
      await prisma.$connect();
      return await prisma.resurrection.create({ data });
    }
    throw error;
  }
}
```

**4. Hook Execution Errors**
- Hook not found
- Hook timeout
- Action failures

**Strategy:**
```typescript
async function executeHookSafely(hookId: string, context: any) {
  const execution = await prisma.hookExecution.create({
    data: { hookId, status: 'TRIGGERED', executionLog: context }
  });
  
  try {
    const hook = await getHook(hookId);
    if (!hook) throw new Error(`Hook ${hookId} not found`);
    
    const result = await Promise.race([
      executeHookActions(hook.actions, context),
      timeout(30000) // 30 second timeout
    ]);
    
    await prisma.hookExecution.update({
      where: { id: execution.id },
      data: { status: 'COMPLETED', executionLog: { ...context, result } }
    });
  } catch (error) {
    await prisma.hookExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', executionLog: { ...context, error: error.message } }
    });
    // Don't throw - log and continue
    console.error(`Hook ${hookId} failed:`, error);
  }
}
```

## Testing Strategy

### Unit Testing
**Framework:** Jest with TypeScript

**Coverage:**
- MCP client wrappers
- Resurrection engine logic
- Hook execution
- Data validation
- API endpoints

**Example:**
```typescript
describe('MCPOrchestrator', () => {
  it('should call ABAP Analyzer MCP for code analysis', async () => {
    const orchestrator = new MCPOrchestrator(mockConfig);
    const result = await orchestrator.analyzeABAP(sampleABAPCode, {});
    
    expect(result).toHaveProperty('businessLogic');
    expect(result).toHaveProperty('dependencies');
    expect(mockMCPClient.call).toHaveBeenCalledWith('analyzeCode', expect.any(Object));
  });
});
```

### Integration Testing
**Scenarios:**
- End-to-end resurrection flow
- MCP server integration
- GitHub repo creation
- Slack notifications
- Hook execution

**Example:**
```typescript
describe('Resurrection Flow', () => {
  it('should complete full resurrection lifecycle', async () => {
    // Upload ABAP
    const upload = await request(app).post('/api/abap/upload').attach('file', abapFile);
    expect(upload.status).toBe(200);
    
    // Start resurrection
    const resurrection = await request(app).post('/api/resurrections').send({
      name: 'test-resurrection',
      abapObjectIds: [upload.body.objectId]
    });
    
    // Wait for completion
    await waitFor(() => resurrection.status === 'TRANSFORMED');
    
    // Verify GitHub repo created
    expect(resurrection.githubUrl).toMatch(/github.com/);
    
    // Verify Slack notification sent
    const notifications = await prisma.slackNotification.findMany({
      where: { resurrectionId: resurrection.id }
    });
    expect(notifications.length).toBeGreaterThan(0);
  });
});
```

### Property-Based Testing
**Framework:** fast-check

**Properties to Test:**
- Dashboard metrics accuracy (Property 13)
- Search result ranking (Property 3)
- Q&A response structure (Property 4)
- CAP file completeness (Properties 7, 10)
- BAS link format (Property 12)

**Example:**
```typescript
import fc from 'fast-check';

describe('Property: CAP Package.json Completeness', () => {
  it('should include all required dependencies for any CAP project', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          businessLogic: fc.object()
        }),
        async (resurrectionData) => {
          const capProject = await generateCAPProject(resurrectionData);
          const packageJson = JSON.parse(capProject.files['package.json']);
          
          expect(packageJson.dependencies).toHaveProperty('@sap/cds');
          expect(packageJson.dependencies).toHaveProperty('@sap/xssec');
          expect(packageJson.dependencies).toHaveProperty('express');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### End-to-End Testing
**Framework:** Playwright

**Scenarios:**
- User onboarding flow
- ABAP upload and analysis
- Resurrection wizard
- GitHub repo creation
- Dashboard interactions

**Example:**
```typescript
test('complete resurrection wizard', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Upload ABAP
  await page.click('text=Upload ABAP');
  await page.setInputFiles('input[type="file"]', 'test-data/Z_PRICING.abap');
  await page.click('text=Analyze');
  
  // Wait for analysis
  await page.waitForSelector('text=Analysis Complete');
  
  // Start resurrection
  await page.click('text=Start Resurrection');
  await page.check('input[value="Z_PRICING"]');
  await page.click('text=Next');
  await page.fill('input[name="projectName"]', 'sd-pricing-logic');
  await page.click('text=Create Resurrection');
  
  // Wait for completion
  await page.waitForSelector('text=Resurrection Complete', { timeout: 60000 });
  
  // Verify GitHub link
  const githubLink = await page.locator('a[href*="github.com"]').getAttribute('href');
  expect(githubLink).toContain('resurrection-sd-pricing-logic');
});
```

