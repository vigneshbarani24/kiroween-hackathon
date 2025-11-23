# Design Document: End-to-End User Flow & SAP BTP Deployment

## Overview

This design document outlines the technical architecture for the SAP Nova AI Alternative platform - a complete CAP application running on SAP BTP that enables ABAP code resurrection through intelligent analysis, transformation, and deployment. The platform leverages Model Context Protocol (MCP) servers for AI-powered transformations, Kiro hooks for quality automation, and Kiro specs for complex project planning.

### Key Design Principles

1. **Cloud-Native SAP BTP Architecture** - Full CAP/CDS implementation with HANA Cloud, Fiori UI, and BTP services
2. **MCP-Powered Intelligence** - Leverage specialized MCP servers for ABAP analysis and CAP generation
3. **Automation via Hooks** - Use Kiro hooks for quality validation, testing, and CI/CD setup
4. **Spec-Driven Planning** - Support complex resurrections with Kiro specs for requirements and tasks
5. **GitHub-First Workflow** - Every resurrection creates a deployable GitHub repository
6. **SAP BAS Integration** - Seamless "Open in BAS" experience for continued development
7. **User Experience Excellence** - Guided wizards, real-time feedback, and intuitive dashboards

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAP BTP Cloud Foundry                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CAP Application                          │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Fiori UI     │  │ CAP Service  │  │ Background   │    │ │
│  │  │ (UI5/Fiori   │◄─┤ (Node.js)    │◄─┤ Jobs         │    │ │
│  │  │  Elements)   │  │ OData V4     │  │ (Batch)      │    │ │
│  │  └──────────────┘  └──────┬───────┘  └──────────────┘    │ │
│  │                            │                                │ │
│  └────────────────────────────┼────────────────────────────────┘ │
│                               │                                   │
│  ┌────────────────────────────┼────────────────────────────────┐ │
│  │                    SAP HANA Cloud                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ HDI Container│  │ CDS Models   │  │ Vector Store │    │ │
│  │  │ (Schema Mgmt)│  │ (Entities)   │  │ (Embeddings) │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    BTP Services                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ XSUAA        │  │ Destination  │  │ Job Scheduler│    │ │
│  │  │ (Auth)       │  │ (External    │  │ (Batch Jobs) │    │ │
│  │  │              │  │  APIs)       │  │              │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ MCP Protocol
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services (via Destination)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ABAP Analyzer│  │ SAP CAP      │  │ SAP UI5      │          │
│  │ MCP Server   │  │ MCP Server   │  │ MCP Server   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ OpenAI API   │  │ GitHub API   │                            │
│  │ (Embeddings) │  │ (Repo Mgmt)  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- SAP Fiori Elements (metadata-driven UI)
- SAPUI5 (Freestyle components for custom visualizations)
- D3.js (Dependency graph visualization)
- SAP Horizon theme

**Backend:**
- SAP CAP (Cloud Application Programming Model) - Node.js
- CDS (Core Data Services) for data modeling
- OData V4 for API exposure
- Express.js middleware for custom endpoints

**Database:**
- SAP HANA Cloud (primary data store)
- HDI (HANA Deployment Infrastructure) for schema management
- HANA Vector Engine for semantic search
- CDS views for efficient queries

**BTP Services:**
- XSUAA (Authentication & Authorization)
- Destination Service (External API connections)
- Job Scheduler (Batch processing)
- Cloud Logging (Monitoring)

**External Integrations:**
- MCP Servers (ABAP Analyzer, CAP Generator, UI5 Generator)
- GitHub API (Repository management)
- OpenAI API (Embeddings and Q&A)
- SAP Business Application Studio (Deep linking)


## Components and Interfaces

### 1. MCP Server Integration Layer

The platform leverages multiple MCP servers for specialized AI capabilities and integrations:

#### Core MCP Servers

**ABAP Analyzer MCP**
- **Purpose:** Parse and analyze legacy ABAP code with SAP domain knowledge
- **Capabilities:** 
  - Syntax parsing and validation
  - Business logic extraction
  - Dependency analysis
  - SAP pattern recognition (pricing, authorization, number ranges)
- **Configuration:** `.kiro/settings/mcp.json` → `abap-analyzer`
- **Connection:** Via BTP Destination service with API key authentication

**SAP CAP Generator MCP**
- **Purpose:** Generate modern CAP applications from ABAP business logic
- **Capabilities:**
  - CDS model generation
  - Service definition creation
  - Event handler implementation
  - Clean Core compliance validation
- **Configuration:** `.kiro/settings/mcp.json` → `sap-cap-generator`
- **Connection:** Via BTP Destination service

**SAP UI5 Generator MCP**
- **Purpose:** Generate Fiori Elements and Freestyle UI5 applications
- **Capabilities:**
  - Fiori Elements annotations
  - UI5 component scaffolding
  - Manifest.json generation
  - Responsive design patterns
- **Configuration:** `.kiro/settings/mcp.json` → `sap-ui5-generator`
- **Connection:** Via BTP Destination service

#### Collaboration MCP Servers

**GitHub MCP**
- **Purpose:** Automate GitHub repository management and collaboration
- **Capabilities:**
  - Repository creation with templates
  - Branch management and protection rules
  - Pull request creation and review
  - Issue tracking and project boards
  - GitHub Actions workflow setup
  - Commit and push operations
  - Repository statistics and insights
- **Configuration:** `.kiro/settings/mcp.json` → `github`
- **Connection:** OAuth GitHub App with user consent
- **Use Cases:**
  - Auto-create resurrection repos
  - Set up CI/CD workflows
  - Create issues for quality failures
  - Manage resurrection project boards
  - Track resurrection progress via commits

**Slack MCP**
- **Purpose:** Send real-time notifications and enable team collaboration
- **Capabilities:**
  - Channel message posting
  - Direct message notifications
  - Interactive message buttons
  - File uploads (reports, logs)
  - Thread conversations
  - User mentions and @channel alerts
- **Configuration:** `.kiro/settings/mcp.json` → `slack`
- **Connection:** Slack Bot Token via BTP Destination service
- **Use Cases:**
  - Notify team when resurrection completes
  - Alert on quality validation failures
  - Share resurrection metrics in channels
  - Request code review via Slack
  - Send daily/weekly resurrection summaries

#### MCP Configuration Example

```json
{
  "mcpServers": {
    "abap-analyzer": {
      "command": "node",
      "args": ["./mcp-servers/abap-analyzer/index.js"],
      "env": {
        "SAP_DOMAIN_KNOWLEDGE": "enabled"
      }
    },
    "sap-cap-generator": {
      "command": "node",
      "args": ["./mcp-servers/cap-generator/index.js"]
    },
    "sap-ui5-generator": {
      "command": "node",
      "args": ["./mcp-servers/ui5-generator/index.js"]
    },
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${destination.github-api.token}"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${destination.slack-api.token}",
        "SLACK_TEAM_ID": "${destination.slack-api.team_id}"
      }
    }
  }
}
```

### 2. Kiro Hooks Configuration

Hooks automate quality validation, testing, and notifications throughout the resurrection lifecycle.

#### Hook Definitions

**on-resurrection-start**
```yaml
trigger: resurrection.started
actions:
  - type: mcp-call
    server: slack
    method: postMessage
    params:
      channel: "#resurrections"
      text: "🚀 Resurrection started: {{resurrection.name}}"
  - type: mcp-call
    server: github
    method: createRepository
    params:
      name: "resurrection-{{resurrection.name}}"
      description: "ABAP to CAP resurrection: {{resurrection.description}}"
      private: false
      auto_init: true
```

**on-resurrection-complete**
```yaml
trigger: resurrection.completed
actions:
  - type: agent-execution
    message: |
      Run quality validation on resurrection {{resurrection.id}}:
      1. Validate CDS syntax
      2. Check Clean Core compliance
      3. Verify business logic preservation
      4. Generate quality report
  - type: mcp-call
    server: github
    method: createIssue
    params:
      repo: "{{resurrection.github_repo}}"
      title: "Quality Validation Results"
      body: "{{quality_report}}"
      labels: ["quality", "automated"]
```

**on-quality-validation-failed**
```yaml
trigger: quality.validation.failed
actions:
  - type: mcp-call
    server: slack
    method: postMessage
    params:
      channel: "#resurrections"
      text: "⚠️ Quality validation failed for {{resurrection.name}}"
      attachments:
        - color: "danger"
          title: "Validation Errors"
          text: "{{validation_errors}}"
          actions:
            - type: "button"
              text: "View in GitHub"
              url: "{{resurrection.github_url}}"
  - type: mcp-call
    server: github
    method: createIssue
    params:
      repo: "{{resurrection.github_repo}}"
      title: "🔴 Quality Validation Failed"
      body: "{{validation_errors}}"
      labels: ["bug", "quality-failure"]
      assignees: ["{{resurrection.owner}}"]
```

**on-deployment-success**
```yaml
trigger: deployment.succeeded
actions:
  - type: mcp-call
    server: slack
    method: postMessage
    params:
      channel: "#resurrections"
      text: "✅ Resurrection deployed successfully!"
      attachments:
        - color: "good"
          title: "{{resurrection.name}}"
          fields:
            - title: "Application URL"
              value: "{{deployment.url}}"
            - title: "GitHub Repo"
              value: "{{resurrection.github_url}}"
            - title: "Lines of Code Saved"
              value: "{{metrics.loc_saved}}"
  - type: mcp-call
    server: github
    method: createRelease
    params:
      repo: "{{resurrection.github_repo}}"
      tag_name: "v1.0.0"
      name: "Production Release"
      body: "Deployed to SAP BTP: {{deployment.url}}"
```

**on-save-in-bas**
```yaml
trigger: file.saved
conditions:
  - file.path matches "*.cds" OR "*.js"
actions:
  - type: shell-command
    command: "npm run lint"
  - type: shell-command
    command: "cds compile --to sql"
  - type: agent-execution
    message: "Validate CDS syntax and report any errors"
```

#### Hook Configuration File

Location: `.kiro/hooks/resurrection-hooks.json`

```json
{
  "hooks": [
    {
      "id": "resurrection-start-notification",
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
      "id": "quality-validation",
      "name": "Run quality checks on completion",
      "trigger": "resurrection.completed",
      "enabled": true,
      "actions": [
        {
          "type": "agent-execution",
          "message": "Validate quality for resurrection {{resurrection.id}}"
        }
      ]
    },
    {
      "id": "github-ci-setup",
      "name": "Configure GitHub Actions CI/CD",
      "trigger": "github.repository.created",
      "enabled": true,
      "actions": [
        {
          "type": "mcp-call",
          "server": "github",
          "method": "createOrUpdateFile",
          "params": {
            "repo": "{{resurrection.github_repo}}",
            "path": ".github/workflows/ci.yml",
            "content": "{{ci_workflow_template}}"
          }
        }
      ]
    }
  ]
}
```

### 3. Notification Flow with Slack MCP

**Resurrection Lifecycle Notifications:**

1. **Start:** "🚀 Resurrection started: sd-pricing-logic"
2. **Progress:** "⏳ Parsing ABAP... 50% complete"
3. **MCP Activity:** "🤖 ABAP Analyzer MCP: Extracted 5 functions, 3 tables"
4. **Transformation:** "🔄 Generating CAP code... CDS models created"
5. **GitHub:** "📦 Repository created: resurrection-sd-pricing-logic"
6. **Quality:** "✅ Quality validation passed - 95% score"
7. **Deployment:** "🚀 Deployed to BTP: https://app.cfapps.sap.hana.ondemand.com"

**Team Collaboration:**

- **Daily Digest:** Slack message at 9 AM with resurrection summary
- **Code Review Requests:** "@john Please review resurrection-sd-pricing-logic"
- **Failure Alerts:** "@channel Quality validation failed - needs attention"
- **Metrics Sharing:** Weekly report with LOC saved, complexity reduced

### 4. GitHub MCP Integration Details

**Repository Creation Workflow:**

```javascript
// When resurrection completes
const repoName = `resurrection-${project.name}-${timestamp}`;

// Use GitHub MCP to create repo
await mcpClient.call('github', 'createRepository', {
  name: repoName,
  description: `ABAP to CAP resurrection: ${project.description}`,
  private: false,
  auto_init: true,
  gitignore_template: 'Node',
  license_template: 'apache-2.0'
});

// Add topics
await mcpClient.call('github', 'replaceAllTopics', {
  repo: repoName,
  topics: ['sap-cap', 'abap-resurrection', 'clean-core', 'sap-btp']
});

// Create initial commit with all files
await mcpClient.call('github', 'createOrUpdateFiles', {
  repo: repoName,
  files: [
    { path: 'README.md', content: readmeContent },
    { path: 'package.json', content: packageJson },
    { path: 'mta.yaml', content: mtaYaml },
    { path: 'db/schema.cds', content: cdsModels },
    { path: 'srv/service.cds', content: serviceDefinition },
    // ... all generated files
  ],
  message: '🔄 Resurrection: ABAP to CAP transformation complete'
});

// Set up branch protection
await mcpClient.call('github', 'updateBranchProtection', {
  repo: repoName,
  branch: 'main',
  required_status_checks: {
    strict: true,
    contexts: ['build', 'test']
  }
});

// Create project board
await mcpClient.call('github', 'createProject', {
  repo: repoName,
  name: 'Resurrection Development',
  body: 'Track resurrection development tasks'
});
```

**GitHub Actions Setup via MCP:**

```yaml
# .github/workflows/ci.yml (created by hook)
name: Resurrection CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
      
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to SAP BTP
        run: |
          cf login -a ${{ secrets.CF_API }} -u ${{ secrets.CF_USER }} -p ${{ secrets.CF_PASSWORD }}
          mbt build
          cf deploy mta_archives/*.mtar
```

### 5. MCP Orchestration Service

**CAP Service: `MCPOrchestrationService`**

Manages MCP server lifecycle, request routing, and response handling.

```javascript
// srv/mcp-orchestration-service.js
const cds = require('@sap/cds');

class MCPOrchestrationService extends cds.ApplicationService {
  async init() {
    // Load MCP configuration
    this.mcpConfig = await this.loadMCPConfig();
    
    // Initialize MCP clients
    this.mcpClients = {
      'abap-analyzer': new MCPClient(this.mcpConfig.abapAnalyzer),
      'sap-cap-generator': new MCPClient(this.mcpConfig.capGenerator),
      'sap-ui5-generator': new MCPClient(this.mcpConfig.ui5Generator),
      'github': new MCPClient(this.mcpConfig.github),
      'slack': new MCPClient(this.mcpConfig.slack)
    };
    
    // Register event handlers
    this.on('analyzeABAP', this.handleAnalyzeABAP);
    this.on('generateCAP', this.handleGenerateCAP);
    this.on('generateUI', this.handleGenerateUI);
    this.on('createGitHubRepo', this.handleCreateGitHubRepo);
    this.on('notifySlack', this.handleNotifySlack);
    
    await super.init();
  }
  
  async handleAnalyzeABAP(req) {
    const { abapCode, context } = req.data;
    
    // Call ABAP Analyzer MCP with streaming
    const stream = await this.mcpClients['abap-analyzer'].callStreaming(
      'analyzeCode',
      { code: abapCode, context }
    );
    
    // Stream progress to client
    for await (const chunk of stream) {
      req.notify({ progress: chunk.progress, message: chunk.message });
    }
    
    return stream.result;
  }
  
  async handleCreateGitHubRepo(req) {
    const { resurrection } = req.data;
    
    // Create repository
    const repo = await this.mcpClients['github'].call('createRepository', {
      name: `resurrection-${resurrection.name}`,
      description: resurrection.description,
      auto_init: true
    });
    
    // Commit all files
    await this.mcpClients['github'].call('createOrUpdateFiles', {
      repo: repo.name,
      files: resurrection.files,
      message: '🔄 Resurrection complete'
    });
    
    // Notify Slack
    await this.mcpClients['slack'].call('postMessage', {
      channel: '#resurrections',
      text: `✅ Repository created: ${repo.html_url}`
    });
    
    return repo;
  }
}

module.exports = MCPOrchestrationService;
```


## Data Models

### CDS Entity Definitions

```cds
// db/schema.cds
namespace sap.resurrection;

using { cuid, managed, temporal } from '@sap/cds/common';

/**
 * Resurrection Project - Main entity for tracking ABAP to CAP transformations
 */
entity Resurrections : cuid, managed {
  name                : String(100) @title: 'Project Name';
  description         : String(500);
  status              : String(20) @assert.range enum {
    UPLOADED;
    ANALYZING;
    ANALYZED;
    TRANSFORMING;
    TRANSFORMED;
    VALIDATING;
    VALIDATED;
    DEPLOYING;
    DEPLOYED;
    FAILED;
  };
  module              : String(10); // SD, MM, FI, etc.
  githubRepo          : String(200);
  githubUrl           : String(500);
  basUrl              : String(500);
  deploymentUrl       : String(500);
  
  // Metrics
  originalLOC         : Integer;
  transformedLOC      : Integer;
  locSaved            : Integer;
  complexityScore     : Decimal(5,2);
  qualityScore        : Decimal(5,2);
  
  // Relationships
  abapObjects         : Composition of many ABAPObjects on abapObjects.resurrection = $self;
  transformationLogs  : Composition of many TransformationLogs on transformationLogs.resurrection = $self;
  qualityReports      : Composition of many QualityReports on qualityReports.resurrection = $self;
  deployments         : Composition of many Deployments on deployments.resurrection = $self;
}

/**
 * ABAP Objects - Individual ABAP programs, functions, reports
 */
entity ABAPObjects : cuid, managed {
  resurrection        : Association to Resurrections;
  name                : String(100) @title: 'Object Name';
  type                : String(20) @assert.range enum {
    FUNCTION;
    REPORT;
    CLASS;
    INTERFACE;
    TABLE;
    VIEW;
  };
  module              : String(10);
  content             : LargeString; // Original ABAP code
  linesOfCode         : Integer;
  complexity          : Integer;
  
  // Analysis results
  documentation       : LargeString; // AI-generated markdown
  businessLogic       : LargeString; // Extracted business rules (JSON)
  dependencies        : LargeString; // Dependency list (JSON)
  tables              : LargeString; // SAP tables used (JSON)
  
  // Vector embeddings for semantic search
  embedding           : Vector(1536); // OpenAI ada-002 dimensions
  
  // Transformation
  selected            : Boolean default false;
  transformed         : Boolean default false;
  transformedCode     : LargeString; // Generated CAP/CDS code
  
  // Relationships
  redundancies        : Association to many Redundancies on redundancies.object1 = $self or redundancies.object2 = $self;
}

/**
 * Redundancies - Detected similar/duplicate code
 */
entity Redundancies : cuid, managed {
  object1             : Association to ABAPObjects;
  object2             : Association to ABAPObjects;
  similarity          : Decimal(5,4); // 0.0 to 1.0
  recommendation      : String(500);
  potentialSavings    : Integer; // Lines of code
  status              : String(20) @assert.range enum {
    DETECTED;
    REVIEWED;
    CONSOLIDATED;
    IGNORED;
  };
}

/**
 * Dependencies - Object relationships
 */
entity Dependencies : cuid {
  source              : Association to ABAPObjects;
  target              : Association to ABAPObjects;
  type                : String(20) @assert.range enum {
    CALLS;
    USES_TABLE;
    INHERITS;
    IMPLEMENTS;
  };
  critical            : Boolean default false;
}

/**
 * Fit-to-Standard Recommendations
 */
entity FitToStandardRecommendations : cuid, managed {
  abapObject          : Association to ABAPObjects;
  standardAlternative : String(100); // BAPI name, transaction code
  confidence          : Decimal(5,2);
  description         : String(1000);
  implementationGuide : LargeString;
  potentialSavings    : Integer;
  status              : String(20) @assert.range enum {
    RECOMMENDED;
    ACCEPTED;
    REJECTED;
    IMPLEMENTED;
  };
}

/**
 * Transformation Logs - Audit trail of MCP calls and transformations
 */
entity TransformationLogs : cuid, managed {
  resurrection        : Association to Resurrections;
  step                : String(50);
  mcpServer           : String(50);
  request             : LargeString; // JSON
  response            : LargeString; // JSON
  duration            : Integer; // milliseconds
  status              : String(20) @assert.range enum {
    STARTED;
    IN_PROGRESS;
    COMPLETED;
    FAILED;
  };
  errorMessage        : String(1000);
}

/**
 * Quality Reports - Validation results
 */
entity QualityReports : cuid, managed {
  resurrection        : Association to Resurrections;
  overallScore        : Decimal(5,2);
  syntaxValid         : Boolean;
  cleanCoreCompliant  : Boolean;
  businessLogicPreserved : Boolean;
  testCoverage        : Decimal(5,2);
  issues              : LargeString; // JSON array of issues
  recommendations     : LargeString; // JSON array
}

/**
 * Deployments - BTP deployment history
 */
entity Deployments : cuid, managed {
  resurrection        : Association to Resurrections;
  environment         : String(20) @assert.range enum {
    DEV;
    TEST;
    PROD;
  };
  url                 : String(500);
  status              : String(20) @assert.range enum {
    DEPLOYING;
    DEPLOYED;
    FAILED;
    ROLLED_BACK;
  };
  deploymentLog       : LargeString;
  healthStatus        : String(20);
}

/**
 * Kiro Specs - Spec-driven resurrection planning
 */
entity ResurrectionSpecs : cuid, managed {
  resurrection        : Association to Resurrections;
  requirementsDoc     : LargeString; // Markdown
  designDoc           : LargeString; // Markdown
  tasksDoc            : LargeString; // Markdown with checkboxes
  status              : String(20) @assert.range enum {
    DRAFT;
    REQUIREMENTS_REVIEW;
    DESIGN_REVIEW;
    TASKS_REVIEW;
    APPROVED;
    IN_PROGRESS;
    COMPLETED;
  };
}

/**
 * Hook Executions - Track hook activity
 */
entity HookExecutions : cuid, managed {
  resurrection        : Association to Resurrections;
  hookId              : String(100);
  hookName            : String(200);
  trigger             : String(100);
  status              : String(20) @assert.range enum {
    TRIGGERED;
    RUNNING;
    COMPLETED;
    FAILED;
  };
  executionLog        : LargeString;
  duration            : Integer;
}

/**
 * Slack Notifications - Track sent notifications
 */
entity SlackNotifications : cuid, managed {
  resurrection        : Association to Resurrections;
  channel             : String(100);
  message             : String(1000);
  messageTs           : String(50); // Slack message timestamp
  threadTs            : String(50); // For threaded replies
  status              : String(20);
}

/**
 * GitHub Activities - Track GitHub operations
 */
entity GitHubActivities : cuid, managed {
  resurrection        : Association to Resurrections;
  activity            : String(50) @assert.range enum {
    REPO_CREATED;
    COMMIT_PUSHED;
    ISSUE_CREATED;
    PR_CREATED;
    RELEASE_CREATED;
    WORKFLOW_TRIGGERED;
  };
  details             : LargeString; // JSON
  githubUrl           : String(500);
}
```

### CDS Service Definitions

```cds
// srv/resurrection-service.cds
using { sap.resurrection as db } from '../db/schema';

/**
 * Main Resurrection Service - OData V4 API
 */
service ResurrectionService @(path: '/api/resurrection') {
  
  // Main entities
  entity Resurrections as projection on db.Resurrections actions {
    action startAnalysis() returns Resurrections;
    action startTransformation() returns Resurrections;
    action deployToBTP(environment: String) returns Resurrections;
    action createGitHubRepo() returns Resurrections;
  };
  
  entity ABAPObjects as projection on db.ABAPObjects actions {
    action generateDocumentation() returns ABAPObjects;
    action selectForTransformation() returns ABAPObjects;
  };
  
  entity Redundancies as projection on db.Redundancies;
  entity Dependencies as projection on db.Dependencies;
  entity FitToStandardRecommendations as projection on db.FitToStandardRecommendations;
  
  // Read-only projections
  @readonly entity TransformationLogs as projection on db.TransformationLogs;
  @readonly entity QualityReports as projection on db.QualityReports;
  @readonly entity Deployments as projection on db.Deployments;
  @readonly entity HookExecutions as projection on db.HookExecutions;
  @readonly entity SlackNotifications as projection on db.SlackNotifications;
  @readonly entity GitHubActivities as projection on db.GitHubActivities;
  
  // Custom functions
  function searchCode(query: String) returns array of ABAPObjects;
  function getDependencyGraph(resurrectionId: UUID) returns LargeString; // JSON
  function getResurrectionMetrics(resurrectionId: UUID) returns {
    totalObjects: Integer;
    locSaved: Integer;
    complexityReduction: Decimal;
    qualityScore: Decimal;
  };
  
  // Q&A Interface
  action askQuestion(question: String) returns {
    answer: String;
    confidence: String;
    sources: array of {
      objectId: UUID;
      name: String;
      relevance: Decimal;
    };
  };
}

/**
 * MCP Orchestration Service - Internal service for MCP management
 */
service MCPService @(path: '/api/mcp') {
  action analyzeABAP(abapCode: LargeString, context: LargeString) returns LargeString;
  action generateCAP(businessLogic: LargeString, context: LargeString) returns LargeString;
  action generateUI(capService: LargeString, context: LargeString) returns LargeString;
  action createGitHubRepo(resurrection: LargeString) returns LargeString;
  action notifySlack(channel: String, message: String) returns LargeString;
  
  function getMCPStatus() returns array of {
    server: String;
    status: String;
    lastCall: DateTime;
    avgResponseTime: Integer;
  };
}

/**
 * Hook Management Service
 */
service HookService @(path: '/api/hooks') {
  entity HookExecutions as projection on db.HookExecutions;
  
  action triggerHook(hookId: String, context: LargeString) returns HookExecutions;
  function listAvailableHooks() returns array of {
    id: String;
    name: String;
    trigger: String;
    enabled: Boolean;
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ABAP File Validation Consistency
*For any* uploaded file, the validation function should return a consistent result (valid/invalid) based on ABAP syntax rules, regardless of file size or complexity.
**Validates: Requirements 3.1**

### Property 2: Dashboard Metrics Accuracy
*For any* set of ABAP objects in a resurrection project, the dashboard statistics (total objects, LOC, complexity) should equal the sum of individual object metrics.
**Validates: Requirements 4.1**

### Property 3: Q&A Response Completeness
*For any* user question submitted to the Q&A interface, the response must include all required fields: answer text, confidence level (high/medium/low), and source references array.
**Validates: Requirements 5.2**

### Property 4: MCP Invocation Reliability
*For any* ABAP code transformation request, the system must successfully invoke the ABAP Analyzer MCP server and receive a parseable response or return a clear error.
**Validates: Requirements 7.1**

### Property 5: Transformation Output Completeness
*For any* completed CAP transformation, the generated project must contain all required files: package.json, mta.yaml, at least one CDS file, and at least one service definition.
**Validates: Requirements 7.5**

### Property 6: Hook Execution Guarantee
*For any* resurrection that reaches "completed" status, the "on-resurrection-complete" hook must be triggered and logged in the HookExecutions table.
**Validates: Requirements 8.1**

### Property 7: GitHub Repository Creation
*For any* successful transformation, a GitHub repository must be created with naming pattern `resurrection-{project-name}-{timestamp}` and return a valid repository URL.
**Validates: Requirements 15.1**

### Property 8: Git Commit Message Consistency
*For any* GitHub repository initialization, the first commit message must exactly match "🔄 Resurrection: ABAP to CAP transformation complete".
**Validates: Requirements 15.3**

### Property 9: BAS Deep Link Generation
*For any* resurrection with a GitHub repository, the generated BAS deep link must follow the format: `https://bas.{region}.hana.ondemand.com/?gitClone={repo_url}` and be a valid URL.
**Validates: Requirements 16.1**

### Property 10: Dependency Graph Completeness
*For any* set of ABAP objects with dependencies, the generated dependency graph must include all objects as nodes and all declared dependencies as edges, with no orphaned nodes.
**Validates: Requirements 4.3**

### Property 11: Slack Notification Delivery
*For any* triggered Slack notification hook, a record must be created in the SlackNotifications table with a valid message_ts (Slack timestamp) indicating successful delivery.
**Validates: Requirements 8 (Slack MCP integration)**

### Property 12: Vector Embedding Consistency
*For any* ABAP object with documentation, the generated vector embedding must have exactly 1536 dimensions (OpenAI ada-002 format) and be stored in HANA Cloud.
**Validates: Requirements 3 (Data Persistence)**

## Error Handling

### Error Categories

**1. MCP Server Errors**
- **Connection Failures:** MCP server unreachable
- **Timeout Errors:** MCP call exceeds 60 second timeout
- **Invalid Response:** MCP returns malformed data
- **Rate Limiting:** MCP server rate limit exceeded

**Handling Strategy:**
```javascript
try {
  const result = await mcpClient.call('abap-analyzer', 'analyzeCode', { code });
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    // Log error, notify admin via Slack
    await slackMCP.postMessage({
      channel: '#platform-alerts',
      text: `🔴 ABAP Analyzer MCP is offline`
    });
    // Return user-friendly error
    throw new Error('Analysis service temporarily unavailable. Please try again in a few minutes.');
  } else if (error.code === 'TIMEOUT') {
    // Retry with exponential backoff
    return await retryWithBackoff(() => mcpClient.call(...), 3);
  }
}
```

**2. GitHub API Errors**
- **Authentication Failures:** Invalid or expired GitHub token
- **Repository Conflicts:** Repository name already exists
- **Rate Limiting:** GitHub API rate limit exceeded
- **Permission Errors:** Insufficient permissions to create repo

**Handling Strategy:**
```javascript
try {
  const repo = await githubMCP.createRepository({ name: repoName });
} catch (error) {
  if (error.status === 422 && error.message.includes('already exists')) {
    // Append timestamp to make unique
    const uniqueName = `${repoName}-${Date.now()}`;
    return await githubMCP.createRepository({ name: uniqueName });
  } else if (error.status === 403) {
    // Rate limit - wait and retry
    const resetTime = error.headers['x-ratelimit-reset'];
    await sleep(resetTime - Date.now());
    return await githubMCP.createRepository({ name: repoName });
  }
}
```

**3. HANA Cloud Errors**
- **Connection Failures:** Database unreachable
- **HDI Deployment Failures:** Schema deployment errors
- **Vector Storage Errors:** Invalid embedding dimensions
- **Transaction Conflicts:** Concurrent update conflicts

**Handling Strategy:**
```javascript
try {
  await INSERT.into(ABAPObjects).entries(object);
} catch (error) {
  if (error.code === 'UNIQUE_CONSTRAINT_VIOLATION') {
    // Update existing record instead
    await UPDATE(ABAPObjects).set(object).where({ ID: object.ID });
  } else if (error.code === 'CONNECTION_LOST') {
    // Retry with connection pool refresh
    await cds.db.disconnect();
    await cds.db.connect();
    return await INSERT.into(ABAPObjects).entries(object);
  }
}
```

**4. Hook Execution Errors**
- **Hook Not Found:** Referenced hook doesn't exist
- **Hook Timeout:** Hook execution exceeds time limit
- **Hook Failure:** Hook action fails
- **Circular Dependencies:** Hook triggers itself

**Handling Strategy:**
```javascript
async function executeHook(hookId, context) {
  const execution = await INSERT.into(HookExecutions).entries({
    hookId,
    status: 'TRIGGERED',
    executionLog: JSON.stringify({ context })
  });
  
  try {
    const hook = await getHook(hookId);
    if (!hook) {
      throw new Error(`Hook ${hookId} not found`);
    }
    
    // Execute with timeout
    const result = await Promise.race([
      executeHookActions(hook.actions, context),
      timeout(30000) // 30 second timeout
    ]);
    
    await UPDATE(HookExecutions).set({
      status: 'COMPLETED',
      executionLog: JSON.stringify({ context, result })
    }).where({ ID: execution.ID });
    
  } catch (error) {
    await UPDATE(HookExecutions).set({
      status: 'FAILED',
      executionLog: JSON.stringify({ context, error: error.message })
    }).where({ ID: execution.ID });
    
    // Don't throw - log and continue
    console.error(`Hook ${hookId} failed:`, error);
  }
}
```

### Global Error Handling Middleware

```javascript
// srv/middleware/error-handler.js
module.exports = (err, req, res, next) => {
  // Log to Cloud Logging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    user: req.user?.id,
    resurrection: req.data?.resurrectionId
  });
  
  // Notify Slack for critical errors
  if (err.severity === 'CRITICAL') {
    slackMCP.postMessage({
      channel: '#platform-alerts',
      text: `🔴 Critical Error: ${err.message}`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'User', value: req.user?.email },
          { title: 'Resurrection', value: req.data?.resurrectionId },
          { title: 'Stack', value: err.stack.substring(0, 500) }
        ]
      }]
    });
  }
  
  // Return user-friendly error
  res.status(err.status || 500).json({
    error: {
      message: err.userMessage || 'An unexpected error occurred',
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};
```

## Testing Strategy

### Unit Testing

**Framework:** Jest with @sap/cds-dk testing utilities

**Test Coverage:**
- CDS service handlers (CRUD operations, custom actions)
- MCP client wrapper functions
- Hook execution logic
- Data validation functions
- Error handling middleware

**Example Unit Test:**
```javascript
// test/resurrection-service.test.js
const cds = require('@sap/cds/lib');
const { expect } = require('chai');

describe('ResurrectionService', () => {
  let service;
  
  beforeAll(async () => {
    service = await cds.connect.to('ResurrectionService');
  });
  
  it('should create resurrection with valid data', async () => {
    const resurrection = await service.create('Resurrections', {
      name: 'test-resurrection',
      description: 'Test project',
      module: 'SD',
      status: 'UPLOADED'
    });
    
    expect(resurrection).to.have.property('ID');
    expect(resurrection.name).to.equal('test-resurrection');
  });
  
  it('should trigger hook on resurrection completion', async () => {
    const resurrection = await service.create('Resurrections', {
      name: 'test-hook',
      status: 'TRANSFORMING'
    });
    
    await service.update('Resurrections', resurrection.ID, {
      status: 'TRANSFORMED'
    });
    
    const hookExecutions = await service.read('HookExecutions', {
      where: { resurrection_ID: resurrection.ID }
    });
    
    expect(hookExecutions).to.have.lengthOf.at.least(1);
    expect(hookExecutions[0].hookId).to.equal('on-resurrection-complete');
  });
});
```

### Integration Testing

**Test Scenarios:**
1. End-to-end resurrection flow (upload → analyze → transform → GitHub → BAS)
2. MCP server integration (ABAP Analyzer, CAP Generator, UI5 Generator)
3. GitHub MCP integration (repo creation, commits, issues)
4. Slack MCP integration (notifications, threading)
5. HANA Cloud vector search
6. Hook execution and chaining

**Example Integration Test:**
```javascript
// test/integration/resurrection-flow.test.js
describe('Complete Resurrection Flow', () => {
  it('should complete full resurrection lifecycle', async () => {
    // 1. Upload ABAP
    const upload = await service.call('uploadABAP', {
      files: [{ name: 'Z_TEST.abap', content: abapCode }]
    });
    expect(upload.resurrection.status).to.equal('UPLOADED');
    
    // 2. Analyze
    await service.call('startAnalysis', { resurrectionId: upload.resurrection.ID });
    const analyzed = await service.read('Resurrections', upload.resurrection.ID);
    expect(analyzed.status).to.equal('ANALYZED');
    
    // 3. Transform
    await service.call('startTransformation', { resurrectionId: upload.resurrection.ID });
    const transformed = await service.read('Resurrections', upload.resurrection.ID);
    expect(transformed.status).to.equal('TRANSFORMED');
    expect(transformed.githubRepo).to.match(/^resurrection-/);
    
    // 4. Verify GitHub repo created
    const githubActivities = await service.read('GitHubActivities', {
      where: { resurrection_ID: upload.resurrection.ID }
    });
    expect(githubActivities).to.have.lengthOf.at.least(1);
    
    // 5. Verify Slack notification sent
    const slackNotifications = await service.read('SlackNotifications', {
      where: { resurrection_ID: upload.resurrection.ID }
    });
    expect(slackNotifications).to.have.lengthOf.at.least(1);
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript property testing library)

**Test Properties:**
- Dashboard metrics calculation (Property 2)
- Q&A response structure (Property 3)
- Transformation output completeness (Property 5)
- GitHub naming conventions (Property 7)
- Vector embedding dimensions (Property 12)

**Example Property Test:**
```javascript
// test/properties/dashboard-metrics.test.js
const fc = require('fast-check');

describe('Property: Dashboard Metrics Accuracy', () => {
  it('should calculate correct totals for any set of ABAP objects', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          name: fc.string(),
          linesOfCode: fc.integer({ min: 1, max: 10000 }),
          complexity: fc.integer({ min: 1, max: 100 })
        })),
        async (abapObjects) => {
          // Create resurrection with objects
          const resurrection = await createResurrectionWithObjects(abapObjects);
          
          // Get dashboard metrics
          const metrics = await service.call('getResurrectionMetrics', {
            resurrectionId: resurrection.ID
          });
          
          // Verify totals match sum of individual objects
          const expectedLOC = abapObjects.reduce((sum, obj) => sum + obj.linesOfCode, 0);
          const expectedComplexity = abapObjects.reduce((sum, obj) => sum + obj.complexity, 0) / abapObjects.length;
          
          expect(metrics.totalObjects).to.equal(abapObjects.length);
          expect(metrics.locSaved).to.be.at.least(0);
          expect(Math.abs(metrics.complexityReduction - expectedComplexity)).to.be.lessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### End-to-End Testing

**Framework:** Playwright for UI testing

**Test Scenarios:**
1. User onboarding wizard
2. ABAP upload and progress tracking
3. Intelligence Dashboard interactions
4. Q&A conversational interface
5. Resurrection wizard flow
6. GitHub repo creation and BAS link

**Example E2E Test:**
```javascript
// test/e2e/resurrection-wizard.spec.js
const { test, expect } = require('@playwright/test');

test('complete resurrection wizard', async ({ page }) => {
  // Navigate to platform
  await page.goto('https://resurrection-platform.cfapps.sap.hana.ondemand.com');
  
  // Login
  await page.fill('#username', 'test@example.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
  
  // Start resurrection
  await page.click('text=Start Resurrection');
  
  // Select objects
  await page.check('input[data-object="Z_PRICING"]');
  await page.check('input[data-object="Z_DISCOUNT"]');
  await page.click('text=Next');
  
  // Review dependencies
  await expect(page.locator('text=Auto-included: 1 dependency')).toBeVisible();
  await page.click('text=Next');
  
  // Configure output
  await page.selectOption('select[name="template"]', 'Fiori Elements List Report');
  await page.click('text=Next');
  
  // Name project
  await page.fill('input[name="projectName"]', 'sd-pricing-logic');
  await page.click('text=Start Resurrection');
  
  // Wait for completion
  await expect(page.locator('text=Resurrection Complete')).toBeVisible({ timeout: 60000 });
  
  // Verify GitHub link
  const githubLink = await page.locator('a[href*="github.com"]').getAttribute('href');
  expect(githubLink).toMatch(/resurrection-sd-pricing-logic/);
  
  // Verify BAS link
  const basLink = await page.locator('text=Open in BAS').getAttribute('href');
  expect(basLink).toContain('bas.hana.ondemand.com');
});
```

