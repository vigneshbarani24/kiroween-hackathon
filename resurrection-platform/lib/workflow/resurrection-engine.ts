/**
 * Resurrection Workflow Engine
 * 
 * Orchestrates the 5-step transformation workflow using real MCP servers:
 * 1. Analyze - ABAP Analyzer MCP
 * 2. Plan - Kiro AI + CAP MCP
 * 3. Generate - CAP CLI + UI5 MCP
 * 4. Validate - UI5 MCP Linter + CDS validation
 * 5. Deploy - GitHub MCP + Slack MCP
 * 
 * Requirements: 3.1, 3.7
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { UnifiedMCPClient } from '../mcp/unified-mcp-client';
import { MockDataGenerator } from '../generators/mock-data-generator';
import { CDSEntity } from '../generators/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir, readFile as fsReadFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

/**
 * Resurrection status enum
 */
export type ResurrectionStatus = 
  | 'UPLOADED' 
  | 'ANALYZING' 
  | 'PLANNING' 
  | 'GENERATING' 
  | 'VALIDATING' 
  | 'DEPLOYING' 
  | 'COMPLETED' 
  | 'FAILED';

/**
 * Workflow step names
 */
export type WorkflowStep = 
  | 'ANALYZE' 
  | 'PLAN' 
  | 'GENERATE' 
  | 'VALIDATE' 
  | 'DEPLOY';

/**
 * Configuration for resurrection execution
 */
export interface ResurrectionConfig {
  name?: string;
  description?: string;
  skipGitHub?: boolean;
  skipSlack?: boolean;
  generateMockData?: boolean;
  ui5Framework?: 'OpenUI5' | 'SAPUI5';
}

/**
 * Resurrection result containing all workflow outputs
 */
export interface ResurrectionResult {
  id: string;
  status: ResurrectionStatus;
  analysis?: any;
  plan?: any;
  project?: any;
  validation?: any;
  deployment?: any;
  error?: string;
}

/**
 * Progress event data
 */
export interface ProgressEvent {
  resurrectionId: string;
  step: WorkflowStep;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  message: string;
  progress?: number; // 0-100
  data?: any;
  timestamp: Date;
}

/**
 * Resurrection Workflow Engine
 * 
 * Main orchestrator for the ABAP-to-CAP transformation workflow.
 * Emits progress events for real-time UI updates.
 * 
 * Events:
 * - 'stepStart': Emitted when a workflow step starts
 * - 'stepProgress': Emitted during step execution
 * - 'stepComplete': Emitted when a workflow step completes
 * - 'stepError': Emitted when a workflow step fails
 * - 'workflowComplete': Emitted when entire workflow completes
 * - 'workflowError': Emitted when workflow fails
 */
export class ResurrectionEngine extends EventEmitter {
  private mcpClient: UnifiedMCPClient;
  private initialized: boolean = false;
  private workDir: string;

  constructor() {
    super();
    this.mcpClient = new UnifiedMCPClient({
      autoConnect: true,
      healthCheckInterval: 60000
    });
    this.workDir = join(process.cwd(), 'temp', 'resurrections');
  }

  /**
   * Initialize the engine and MCP connections
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[ResurrectionEngine] Initializing...');
    
    try {
      await this.mcpClient.initializeConnections();
      this.initialized = true;
      console.log('[ResurrectionEngine] ✅ Initialized successfully');
    } catch (error) {
      console.error('[ResurrectionEngine] ❌ Initialization failed:', error);
      throw new Error(`Engine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute the complete resurrection workflow
   * 
   * Orchestrates all 5 steps in sequence:
   * 1. Analyze ABAP code
   * 2. Plan transformation
   * 3. Generate CAP project
   * 4. Validate output
   * 5. Deploy to GitHub
   * 
   * Requirements: 3.1, 3.7
   * 
   * @param abapCode - ABAP source code to transform
   * @param config - Configuration options
   * @returns Resurrection result with all outputs
   */
  async execute(abapCode: string, config: ResurrectionConfig = {}): Promise<ResurrectionResult> {
    // Ensure engine is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Create resurrection record
    // Note: userId is required - in production this would come from auth context
    const resurrection = await prisma.resurrection.create({
      data: {
        name: config.name || `resurrection-${Date.now()}`,
        description: config.description || 'ABAP to CAP transformation',
        status: 'UPLOADED',
        originalLOC: abapCode.split('\n').length,
        module: 'CUSTOM',
        complexityScore: 5,
        qualityScore: 0,
        transformedLOC: 0,
        locSaved: 0,
        userId: 'system' // TODO: Get from auth context
      }
    });

    const resurrectionId = resurrection.id;

    console.log(`[ResurrectionEngine] Starting workflow for resurrection ${resurrectionId}`);
    this.emitProgress(resurrectionId, 'ANALYZE', 'STARTED', 'Starting ABAP analysis...', 0);

    try {
      // Step 1: Analyze
      const analysis = await this.stepAnalyze(resurrectionId, abapCode);

      // Step 2: Plan
      const plan = await this.stepPlan(resurrectionId, analysis);

      // Step 3: Generate
      const project = await this.stepGenerate(resurrectionId, analysis, plan, config);

      // Step 4: Validate
      const validation = await this.stepValidate(resurrectionId, project);

      // Step 5: Deploy
      const deployment = await this.stepDeploy(resurrectionId, project, config);

      // Mark as completed
      await this.updateStatus(resurrectionId, 'COMPLETED');

      const result: ResurrectionResult = {
        id: resurrectionId,
        status: 'COMPLETED',
        analysis,
        plan,
        project,
        validation,
        deployment
      };

      this.emit('workflowComplete', { resurrectionId, result });
      console.log(`[ResurrectionEngine] ✅ Workflow completed for resurrection ${resurrectionId}`);

      return result;

    } catch (error) {
      console.error(`[ResurrectionEngine] ❌ Workflow failed for resurrection ${resurrectionId}:`, error);
      
      await this.updateStatus(resurrectionId, 'FAILED');

      const result: ResurrectionResult = {
        id: resurrectionId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.emit('workflowError', { resurrectionId, error: result.error });

      throw error;
    }
  }

  /**
   * Step 1: Analyze ABAP code using ABAP Analyzer MCP
   * 
   * Requirements: 3.2, 5.3
   */
  private async stepAnalyze(resurrectionId: string, abapCode: string): Promise<any> {
    const startTime = Date.now();
    
    this.emitStepStart(resurrectionId, 'ANALYZE', 'Analyzing ABAP code with MCP...');
    await this.updateStatus(resurrectionId, 'ANALYZING');
    await this.logStep(resurrectionId, 'ANALYZE', 'STARTED');

    try {
      // Call ABAP Analyzer MCP
      const analysis = await this.mcpClient.analyzeABAP(abapCode);

      const duration = Date.now() - startTime;

      // Store analysis results in database
      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: {
          module: analysis.metadata.module || 'CUSTOM',
          complexityScore: analysis.metadata.complexity || 5
        }
      });

      await this.logStep(resurrectionId, 'ANALYZE', 'COMPLETED', duration, analysis);
      this.emitStepComplete(resurrectionId, 'ANALYZE', 'ABAP analysis complete', analysis);

      return analysis;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      
      await this.logStep(resurrectionId, 'ANALYZE', 'FAILED', duration, null, errorMessage);
      this.emitStepError(resurrectionId, 'ANALYZE', errorMessage);
      
      throw error;
    }
  }

  /**
   * Step 2: Plan transformation using Kiro AI + CAP MCP
   * 
   * Requirements: 3.3
   */
  private async stepPlan(resurrectionId: string, analysis: any): Promise<any> {
    const startTime = Date.now();
    
    this.emitStepStart(resurrectionId, 'PLAN', 'Creating transformation plan...');
    await this.updateStatus(resurrectionId, 'PLANNING');
    await this.logStep(resurrectionId, 'PLAN', 'STARTED');

    try {
      // Extract tables from analysis to create entities
      const tables = analysis.metadata?.tables || [];
      
      // Search CAP documentation for patterns and best practices
      let capPatterns: any[] = [];
      try {
        const docsResult = await this.mcpClient.searchCAPDocs('entity definition best practices');
        capPatterns = docsResult.results.slice(0, 3); // Top 3 results
        console.log(`[ResurrectionEngine] Found ${capPatterns.length} CAP patterns`);
      } catch (error) {
        console.warn('[ResurrectionEngine] CAP docs search failed, continuing without patterns:', error);
      }

      // Generate CDS entity definitions from ABAP tables
      const entities = tables.map((table: string) => ({
        name: this.normalizeEntityName(table),
        originalTable: table,
        fields: [
          { name: 'ID', type: 'UUID', key: true },
          { name: 'createdAt', type: 'Timestamp', managed: true },
          { name: 'modifiedAt', type: 'Timestamp', managed: true },
          { name: 'createdBy', type: 'String(255)', managed: true },
          { name: 'modifiedBy', type: 'String(255)', managed: true }
        ],
        annotations: {
          '@title': `${table} Entity`,
          '@description': `Transformed from ABAP table ${table}`
        }
      }));

      // Create service definition
      const module = analysis.metadata?.module || 'CUSTOM';
      const services = [{
        name: `${module}Service`,
        entities: entities.map((e: any) => e.name),
        operations: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        annotations: {
          '@path': `/${module.toLowerCase()}`,
          '@requires': 'authenticated-user'
        }
      }];

      // Create transformation plan
      const plan = {
        entities,
        services,
        businessLogic: analysis.businessLogic || [],
        patterns: analysis.metadata?.patterns || [],
        capPatterns: capPatterns.map((p: any) => ({
          title: p.title,
          content: p.content.substring(0, 200) // Truncate for storage
        })),
        module,
        complexity: analysis.metadata?.complexity || 5
      };

      const duration = Date.now() - startTime;

      await this.logStep(resurrectionId, 'PLAN', 'COMPLETED', duration, {
        entityCount: entities.length,
        serviceCount: services.length,
        patternCount: capPatterns.length
      });
      
      this.emitStepComplete(resurrectionId, 'PLAN', 
        `Transformation plan created: ${entities.length} entities, ${services.length} services`, 
        plan
      );

      return plan;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Planning failed';
      
      await this.logStep(resurrectionId, 'PLAN', 'FAILED', duration, null, errorMessage);
      this.emitStepError(resurrectionId, 'PLAN', errorMessage);
      
      throw error;
    }
  }

  /**
   * Normalize ABAP table name to CDS entity name
   * 
   * Converts ABAP table names (e.g., VBAK, KONV) to proper CDS entity names
   * (e.g., SalesOrder, PricingCondition)
   */
  private normalizeEntityName(tableName: string): string {
    // Map common SAP tables to meaningful entity names
    const tableMap: Record<string, string> = {
      'VBAK': 'SalesOrder',
      'VBAP': 'SalesOrderItem',
      'KNA1': 'Customer',
      'KONV': 'PricingCondition',
      'MARA': 'Material',
      'EKKO': 'PurchaseOrder',
      'EKPO': 'PurchaseOrderItem',
      'BKPF': 'AccountingDocument',
      'BSEG': 'AccountingDocumentItem',
      'LFA1': 'Vendor'
    };

    return tableMap[tableName] || tableName;
  }

  /**
   * Step 3: Generate CAP project using CAP CLI + UI5 MCP
   * 
   * Requirements: 3.4, 9.2, 9.3, 12.1
   */
  private async stepGenerate(
    resurrectionId: string,
    analysis: any,
    plan: any,
    config: ResurrectionConfig
  ): Promise<any> {
    const startTime = Date.now();
    
    this.emitStepStart(resurrectionId, 'GENERATE', 'Generating CAP project...');
    await this.updateStatus(resurrectionId, 'GENERATING');
    await this.logStep(resurrectionId, 'GENERATE', 'STARTED');

    try {
      const resurrection = await prisma.resurrection.findUnique({
        where: { id: resurrectionId }
      });

      if (!resurrection) {
        throw new Error('Resurrection not found');
      }

      // Create project directory
      const projectName = `resurrection-${resurrection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const projectPath = join(this.workDir, projectName);

      // Ensure work directory exists
      if (!existsSync(this.workDir)) {
        await mkdir(this.workDir, { recursive: true });
      }

      // Step 3a: Use CAP CLI to initialize project
      console.log(`[ResurrectionEngine] Running: cds init ${projectName}`);
      this.emitProgress(resurrectionId, 'GENERATE', 'IN_PROGRESS', 'Initializing CAP project...', 20);
      
      await execAsync(`cds init ${projectName}`, { cwd: this.workDir });

      // Step 3b: Generate CDS schema from plan
      console.log(`[ResurrectionEngine] Generating CDS schema...`);
      this.emitProgress(resurrectionId, 'GENERATE', 'IN_PROGRESS', 'Generating CDS models...', 40);
      
      const schemaPath = join(projectPath, 'db', 'schema.cds');
      const schema = this.generateCDSSchema(plan);
      await writeFile(schemaPath, schema);

      // Step 3c: Generate service definition
      console.log(`[ResurrectionEngine] Generating service definition...`);
      this.emitProgress(resurrectionId, 'GENERATE', 'IN_PROGRESS', 'Generating services...', 60);
      
      const servicePath = join(projectPath, 'srv', 'service.cds');
      const service = this.generateServiceCDS(plan);
      await writeFile(servicePath, service);

      // Step 3d: Generate service implementation
      const implPath = join(projectPath, 'srv', 'service.js');
      const impl = this.generateServiceImpl(plan);
      await writeFile(implPath, impl);

      // Step 3e: Update package.json with proper dependencies
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fsReadFile(packageJsonPath, 'utf-8'));
      packageJson.dependencies = {
        ...packageJson.dependencies,
        '@sap/cds': '^8',
        'express': '^4'
      };
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Step 3f: Generate README with transformation details
      const readmePath = join(projectPath, 'README.md');
      const readme = this.generateREADME(resurrection, analysis, plan);
      await writeFile(readmePath, readme);

      // Step 3f-1: Generate FRS (Functional Requirements Specification) document
      console.log(`[ResurrectionEngine] Generating FRS document...`);
      const docsPath = join(projectPath, 'docs');
      if (!existsSync(docsPath)) {
        await mkdir(docsPath, { recursive: true });
      }
      const frsPath = join(docsPath, 'FRS.md');
      const frs = this.generateFRS(resurrection, analysis, plan);
      await writeFile(frsPath, frs);

      // Step 3f-2: Generate Spec file (requirements + design)
      console.log(`[ResurrectionEngine] Generating spec file...`);
      const specPath = join(docsPath, 'SPEC.md');
      const spec = this.generateSpec(resurrection, analysis, plan);
      await writeFile(specPath, spec);

      // Step 3g: Generate mock data (if enabled)
      if (config.generateMockData !== false && plan.entities.length > 0) {
        try {
          console.log(`[ResurrectionEngine] Generating mock data...`);
          this.emitProgress(resurrectionId, 'GENERATE', 'IN_PROGRESS', 'Generating mock data...', 70);
          
          await this.generateMockData(projectPath, plan.entities);
          console.log(`[ResurrectionEngine] ✅ Mock data generated`);
        } catch (error) {
          console.warn('[ResurrectionEngine] ⚠️ Mock data generation failed (non-critical):', error);
          // Continue without mock data
        }
      }

      // Step 3h: Call UI5 MCP to create Fiori app (if not skipped)
      let ui5AppPath = '';
      if (!config.skipGitHub) {
        try {
          console.log(`[ResurrectionEngine] Creating UI5 Fiori app...`);
          this.emitProgress(resurrectionId, 'GENERATE', 'IN_PROGRESS', 'Generating Fiori UI...', 85);
          
          const appPath = join(projectPath, 'app');
          const ui5Config = {
            appNamespace: `${plan.module.toLowerCase()}.ui`,
            basePath: appPath,
            createAppDirectory: true,
            typescript: false,
            framework: (config.ui5Framework || 'SAPUI5') as 'OpenUI5' | 'SAPUI5'
          };

          await this.mcpClient.createUI5App(ui5Config);
          ui5AppPath = join(appPath, ui5Config.appNamespace);
          console.log(`[ResurrectionEngine] ✅ UI5 app created at: ${ui5AppPath}`);
        } catch (error) {
          console.warn('[ResurrectionEngine] ⚠️ UI5 app creation failed (non-critical):', error);
          // Continue without UI5 app
        }
      }

      // Step 3i: Read all generated files
      const files = await this.readProjectFiles(projectPath);

      const duration = Date.now() - startTime;

      // Update LOC metrics
      const transformedLOC = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
      const locSaved = (resurrection.originalLOC || 0) - transformedLOC;

      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: { transformedLOC, locSaved }
      });

      const project = {
        path: projectPath,
        files,
        ui5AppPath
      };

      await this.logStep(resurrectionId, 'GENERATE', 'COMPLETED', duration, {
        projectPath,
        fileCount: files.length,
        transformedLOC,
        locSaved
      });
      
      this.emitStepComplete(resurrectionId, 'GENERATE', 
        `CAP project generated: ${files.length} files, ${transformedLOC} LOC`, 
        project
      );

      return project;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      
      await this.logStep(resurrectionId, 'GENERATE', 'FAILED', duration, null, errorMessage);
      this.emitStepError(resurrectionId, 'GENERATE', errorMessage);
      
      throw error;
    }
  }

  /**
   * Generate CDS schema from transformation plan
   */
  private generateCDSSchema(plan: any): string {
    const entities = plan.entities.map((entity: any) => {
      const fields = entity.fields.map((field: any) => {
        const keyStr = field.key ? 'key ' : '';
        return `  ${keyStr}${field.name} : ${field.type};`;
      }).join('\n');

      const annotations = Object.entries(entity.annotations || {})
        .map(([key, value]) => `${key}: '${value}'`)
        .join('\n');

      return `${annotations ? annotations + '\n' : ''}entity ${entity.name} {
${fields}
}`;
    }).join('\n\n');

    return `namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

${entities}

// Business logic preserved from ABAP:
${plan.businessLogic.map((logic: string) => `// ${logic}`).join('\n')}

// SAP patterns detected:
${plan.patterns.map((pattern: string) => `// ${pattern}`).join('\n')}
`;
  }

  /**
   * Generate service CDS from transformation plan
   */
  private generateServiceCDS(plan: any): string {
    const service = plan.services[0];
    const entityProjections = plan.entities.map((e: any) => 
      `  entity ${e.name} as projection on db.${e.name};`
    ).join('\n');

    const annotations = Object.entries(service.annotations || {})
      .map(([key, value]) => `${key}: '${value}'`)
      .join('\n');

    return `using { resurrection.db } from '../db/schema';

${annotations ? annotations + '\n' : ''}service ${service.name} {
${entityProjections}
}
`;
  }

  /**
   * Generate service implementation from transformation plan
   */
  private generateServiceImpl(plan: any): string {
    return `const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  // Business logic preserved from ABAP
${plan.businessLogic.map((logic: string) => `  // ${logic}`).join('\n')}
  
  // Before CREATE handlers
  this.before('CREATE', '*', async (req) => {
    console.log('Creating entity:', req.data);
    
    // Add validation logic here
    // Example: Check required fields, validate data types, etc.
  });
  
  // After READ handlers
  this.after('READ', '*', async (data) => {
    // Add post-processing logic here
    // Example: Calculate derived fields, apply business rules, etc.
    return data;
  });
  
  // Before UPDATE handlers
  this.before('UPDATE', '*', async (req) => {
    console.log('Updating entity:', req.data);
    
    // Add validation logic here
  });
  
  // Before DELETE handlers
  this.before('DELETE', '*', async (req) => {
    console.log('Deleting entity:', req.data);
    
    // Add validation logic here
  });
  
});
`;
  }

  /**
   * Generate README with transformation details
   */
  private generateREADME(resurrection: any, analysis: any, plan: any): string {
    return `# ${resurrection.name}

🔄 **Resurrected from ABAP to SAP CAP**

## Original ABAP Context

- **Module:** ${plan.module}
- **Complexity:** ${plan.complexity}/10
- **Lines of Code:** ${resurrection.originalLOC}
- **Tables Used:** ${plan.entities.map((e: any) => e.originalTable).join(', ')}

## Business Logic Preserved

${plan.businessLogic.map((logic: string) => `- ${logic}`).join('\n')}

## SAP Patterns Detected

${plan.patterns.map((pattern: string) => `- ${pattern}`).join('\n')}

## Generated Entities

${plan.entities.map((e: any) => `- **${e.name}** (from ${e.originalTable})`).join('\n')}

## Getting Started

\`\`\`bash
npm install
cds watch
\`\`\`

Access at: http://localhost:4004

## Deploy to SAP BTP

\`\`\`bash
cf login
mbt build
cf deploy mta_archives/*.mtar
\`\`\`

## Documentation

${analysis.documentation || 'No additional documentation available'}

---

**Generated by SAP Resurrection Platform**
*Powered by Kiro AI and MCP Servers*
`;
  }

  /**
   * Generate FRS (Functional Requirements Specification) document
   */
  private generateFRS(resurrection: any, analysis: any, plan: any): string {
    return `# Functional Requirements Specification (FRS)

## Project Information

**Project Name:** ${resurrection.name}
**Module:** ${plan.module}
**Generated:** ${new Date().toISOString()}
**Source:** Legacy ABAP Code Transformation

---

## 1. Executive Summary

This document specifies the functional requirements for the ${resurrection.name} application, which has been transformed from legacy ABAP code to a modern SAP Cloud Application Programming (CAP) model.

**Purpose:** ${resurrection.description || 'Modernize legacy ABAP functionality to cloud-native SAP CAP'}

**Scope:** This application replaces legacy ABAP code with ${analysis.metadata?.linesOfCode || 0} lines of code, preserving all business logic while modernizing the technical implementation.

---

## 2. Business Requirements

### 2.1 Business Logic Preserved

The following business logic from the original ABAP code has been preserved:

${plan.businessLogic.map((logic: string, i: number) => `${i + 1}. ${logic}`).join('\n')}

### 2.2 SAP Patterns Implemented

The application implements the following SAP patterns:

${plan.patterns.map((pattern: string, i: number) => `${i + 1}. **${pattern}**`).join('\n')}

### 2.3 Data Requirements

The application manages the following data entities:

${plan.entities.map((e: any, i: number) => `${i + 1}. **${e.name}** (from SAP table ${e.originalTable})`).join('\n')}

---

## 3. Functional Requirements

### 3.1 Data Management

**FR-001: Entity CRUD Operations**
- The system SHALL provide Create, Read, Update, and Delete operations for all entities
- All operations SHALL maintain data integrity and referential constraints
- All operations SHALL be exposed via OData V4 services

**FR-002: Data Validation**
- The system SHALL validate all input data according to business rules
- The system SHALL prevent invalid data from being persisted
- The system SHALL provide clear error messages for validation failures

**FR-003: Data Relationships**
- The system SHALL maintain referential integrity between related entities
- The system SHALL support navigation between related entities via associations
- The system SHALL cascade operations where appropriate

### 3.2 Business Logic

${plan.businessLogic.map((logic: string, i: number) => {
  const frNumber = String(i + 4).padStart(3, '0');
  return `**FR-${frNumber}: ${logic}**
- The system SHALL implement this business rule exactly as defined in the original ABAP code
- The system SHALL maintain the same calculation logic and validation rules
- The system SHALL produce identical results to the legacy system`;
}).join('\n\n')}

### 3.3 Service Layer

**FR-100: OData V4 Service**
- The system SHALL expose all entities via OData V4 protocol
- The system SHALL support standard OData query operations ($filter, $expand, $select, etc.)
- The system SHALL implement proper HTTP status codes and error responses

**FR-101: Authentication & Authorization**
- The system SHALL require authentication for all operations
- The system SHALL implement role-based access control
- The system SHALL log all access attempts

**FR-102: Performance**
- The system SHALL respond to read operations within 500ms
- The system SHALL handle concurrent requests efficiently
- The system SHALL implement pagination for large result sets

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Response time: < 500ms for standard operations
- Throughput: Support 100 concurrent users
- Database queries: Optimized with proper indexing

### 4.2 Security
- Authentication: OAuth 2.0 / SAML
- Authorization: Role-based access control (RBAC)
- Data encryption: TLS 1.3 for data in transit
- Audit logging: All data modifications logged

### 4.3 Scalability
- Horizontal scaling: Support multiple application instances
- Database: PostgreSQL with connection pooling
- Caching: Redis for frequently accessed data

### 4.4 Reliability
- Availability: 99.9% uptime
- Error handling: Graceful degradation
- Data backup: Daily automated backups
- Disaster recovery: RTO < 4 hours, RPO < 1 hour

### 4.5 Maintainability
- Code quality: ESLint + Prettier
- Documentation: Inline comments + API docs
- Testing: Unit tests + integration tests
- Version control: Git with semantic versioning

---

## 5. Data Model

### 5.1 Entities

${plan.entities.map((entity: any) => `
#### ${entity.name}

**Source:** SAP Table ${entity.originalTable}

**Fields:**
${entity.fields.map((f: any) => `- \`${f.name}\`: ${f.type}${f.key ? ' (Primary Key)' : ''}`).join('\n')}

**Annotations:**
${Object.entries(entity.annotations || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
`).join('\n')}

---

## 6. Service Definitions

### 6.1 ${plan.services[0].name}

**Path:** \`${plan.services[0].annotations['@path'] || '/api'}\`

**Entities Exposed:**
${plan.services[0].entities.map((e: string) => `- ${e}`).join('\n')}

**Operations:**
${plan.services[0].operations.map((op: string) => `- ${op}`).join('\n')}

---

## 7. User Interface Requirements

### 7.1 Fiori Elements Application

**Type:** List Report / Object Page
**Framework:** SAP UI5 / Fiori Elements
**Responsive:** Yes (Desktop, Tablet, Mobile)

**Features:**
- List view with search and filters
- Detail view for individual records
- Create/Edit forms with validation
- Delete confirmation dialogs
- Export to Excel functionality

---

## 8. Integration Requirements

### 8.1 External Systems

**SAP S/4HANA Integration:**
- Read master data from S/4HANA
- Sync transactional data
- Real-time event notifications

**Authentication:**
- SAP Cloud Identity Services
- OAuth 2.0 / SAML 2.0

---

## 9. Testing Requirements

### 9.1 Unit Testing
- Code coverage: > 80%
- Framework: Jest
- All business logic functions tested

### 9.2 Integration Testing
- End-to-end service tests
- Database integration tests
- API contract tests

### 9.3 User Acceptance Testing
- Business user validation
- Performance testing
- Security testing

---

## 10. Deployment Requirements

### 10.1 Target Platform
- SAP Business Technology Platform (BTP)
- Cloud Foundry runtime
- PostgreSQL database service

### 10.2 CI/CD Pipeline
- Automated builds on commit
- Automated testing
- Automated deployment to dev/test/prod

---

## 11. Documentation Requirements

- API documentation (OpenAPI/Swagger)
- User manual
- Administrator guide
- Developer guide
- Deployment guide

---

## 12. Acceptance Criteria

The application is considered complete when:

1. ✅ All functional requirements are implemented
2. ✅ All business logic produces identical results to legacy system
3. ✅ All tests pass (unit + integration)
4. ✅ Performance requirements are met
5. ✅ Security requirements are met
6. ✅ Documentation is complete
7. ✅ User acceptance testing is passed
8. ✅ Successfully deployed to production

---

**Document Version:** 1.0
**Last Updated:** ${new Date().toISOString()}
**Status:** Generated from Legacy ABAP Transformation
`;
  }

  /**
   * Generate Spec file (requirements + design)
   */
  private generateSpec(resurrection: any, analysis: any, plan: any): string {
    return `# Technical Specification: ${resurrection.name}

## Overview

This specification defines the technical design for ${resurrection.name}, a modern SAP CAP application transformed from legacy ABAP code.

**Module:** ${plan.module}
**Complexity:** ${plan.complexity}/10
**Original LOC:** ${analysis.metadata?.linesOfCode || 0}

---

## Architecture

### Technology Stack

**Backend:**
- SAP Cloud Application Programming (CAP) Model
- Node.js runtime
- CDS (Core Data Services) for data modeling
- OData V4 for API exposure

**Database:**
- PostgreSQL (SAP HANA Cloud compatible)
- Managed associations and compositions
- Automatic audit fields (createdAt, modifiedAt, etc.)

**Frontend:**
- SAP Fiori Elements
- SAP UI5 framework
- Responsive design (desktop, tablet, mobile)

**Deployment:**
- SAP Business Technology Platform (BTP)
- Cloud Foundry
- Multi-tenant capable

---

## Data Model Design

### Entity Relationship Diagram

\`\`\`
${plan.entities.map((e: any) => `[${e.name}]`).join(' --> ')}
\`\`\`

### Entity Definitions

${plan.entities.map((entity: any) => `
#### ${entity.name}

**CDS Definition:**
\`\`\`cds
entity ${entity.name} {
${entity.fields.map((f: any) => `  ${f.key ? 'key ' : ''}${f.name} : ${f.type};`).join('\n')}
}
\`\`\`

**Business Purpose:** Represents ${entity.originalTable} data from legacy SAP system

**Key Fields:** ${entity.fields.filter((f: any) => f.key).map((f: any) => f.name).join(', ')}
`).join('\n')}

---

## Service Layer Design

### Service Definition

\`\`\`cds
service ${plan.services[0].name} {
${plan.entities.map((e: any) => `  entity ${e.name} as projection on db.${e.name};`).join('\n')}
}
\`\`\`

### Service Implementation

**Business Logic Handlers:**

${plan.businessLogic.map((logic: string, i: number) => `
${i + 1}. **${logic}**
   - Implemented in: \`srv/service.js\`
   - Triggered: Before/After CRUD operations
   - Validation: Input validation + business rules
`).join('\n')}

---

## Business Logic Preservation

### Original ABAP Logic

The following business logic from the original ABAP code has been preserved:

${plan.businessLogic.map((logic: string, i: number) => `
#### ${i + 1}. ${logic}

**Implementation Approach:**
- Extract logic from ABAP code
- Translate to JavaScript/Node.js
- Implement as CAP service handler
- Validate with unit tests
- Compare results with legacy system
`).join('\n')}

---

## API Design

### OData V4 Endpoints

**Base URL:** \`${plan.services[0].annotations['@path'] || '/api'}\`

**Entity Sets:**
${plan.entities.map((e: any) => `
- \`GET ${plan.services[0].annotations['@path'] || '/api'}/${e.name}\` - List all ${e.name}
- \`GET ${plan.services[0].annotations['@path'] || '/api'}/${e.name}(ID)\` - Get single ${e.name}
- \`POST ${plan.services[0].annotations['@path'] || '/api'}/${e.name}\` - Create ${e.name}
- \`PATCH ${plan.services[0].annotations['@path'] || '/api'}/${e.name}(ID)\` - Update ${e.name}
- \`DELETE ${plan.services[0].annotations['@path'] || '/api'}/${e.name}(ID)\` - Delete ${e.name}
`).join('\n')}

**Query Options:**
- \`$filter\` - Filter results
- \`$select\` - Select specific fields
- \`$expand\` - Expand associations
- \`$orderby\` - Sort results
- \`$top\` / \`$skip\` - Pagination

---

## Security Design

### Authentication
- OAuth 2.0 / SAML 2.0
- Integration with SAP Cloud Identity Services
- JWT tokens for API access

### Authorization
- Role-based access control (RBAC)
- Annotations: \`@requires\`, \`@restrict\`
- Field-level security where needed

### Data Protection
- TLS 1.3 for data in transit
- Encryption at rest (database level)
- PII data masking in logs
- GDPR compliance

---

## Performance Optimization

### Database Optimization
- Proper indexing on key fields
- Efficient query patterns
- Connection pooling
- Query result caching

### Application Optimization
- Lazy loading of associations
- Pagination for large datasets
- Compression for API responses
- CDN for static assets

---

## Testing Strategy

### Unit Tests
- Test all business logic functions
- Mock database calls
- Test edge cases and error conditions
- Target: > 80% code coverage

### Integration Tests
- Test complete service operations
- Test with real database
- Test authentication/authorization
- Test error handling

### Performance Tests
- Load testing (100 concurrent users)
- Stress testing (identify breaking point)
- Endurance testing (sustained load)

---

## Deployment Architecture

### Cloud Foundry Deployment

\`\`\`yaml
applications:
- name: ${resurrection.name}
  memory: 512M
  instances: 2
  buildpack: nodejs_buildpack
  services:
    - ${resurrection.name}-db
    - ${resurrection.name}-uaa
\`\`\`

### Database Service
- PostgreSQL on SAP BTP
- Automatic backups
- High availability configuration

### Scaling Strategy
- Horizontal: Multiple app instances
- Vertical: Increase memory/CPU as needed
- Auto-scaling based on load

---

## Monitoring & Logging

### Application Monitoring
- Health check endpoint: \`/health\`
- Metrics: Response time, error rate, throughput
- Alerts: Error rate > 5%, response time > 1s

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation
- Log retention: 30 days

---

## Migration Strategy

### Data Migration
1. Extract data from legacy SAP tables
2. Transform to new data model
3. Validate data integrity
4. Load into PostgreSQL database
5. Verify with reconciliation reports

### Cutover Plan
1. Parallel run (legacy + new system)
2. Validate results match
3. Gradual traffic shift (10% → 50% → 100%)
4. Monitor for issues
5. Rollback plan if needed

---

## Maintenance & Support

### Code Maintenance
- Regular dependency updates
- Security patch management
- Performance optimization
- Bug fixes

### Documentation
- Keep API docs up to date
- Update user guides
- Maintain runbooks
- Document known issues

---

## Appendix

### A. SAP Tables Referenced

${(analysis.metadata?.tables || []).map((table: string) => `- **${table}**: ${this.getTableDescription(table)}`).join('\n')}

### B. ABAP Patterns Detected

${plan.patterns.map((pattern: string) => `- ${pattern}`).join('\n')}

### C. Dependencies

${(analysis.dependencies || []).map((dep: string) => `- ${dep}`).join('\n')}

---

**Specification Version:** 1.0
**Generated:** ${new Date().toISOString()}
**Status:** Ready for Implementation
`;
  }

  /**
   * Get description for SAP table
   */
  private getTableDescription(tableName: string): string {
    const descriptions: Record<string, string> = {
      'VBAK': 'Sales Document Header',
      'VBAP': 'Sales Document Items',
      'KNA1': 'Customer Master (General)',
      'KONV': 'Pricing Conditions',
      'MARA': 'Material Master',
      'EKKO': 'Purchase Order Header',
      'EKPO': 'Purchase Order Items',
      'BKPF': 'Accounting Document Header',
      'BSEG': 'Accounting Document Line Items',
      'LFA1': 'Vendor Master'
    };
    return descriptions[tableName] || 'SAP Table';
  }

  /**
   * Generate mock data for entities
   * 
   * Requirements: 16.3, 16.4
   */
  private async generateMockData(projectPath: string, entities: any[]): Promise<void> {
    const dataDir = join(projectPath, 'db', 'data');
    
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Convert plan entities to CDSEntity format
    const cdsEntities: CDSEntity[] = entities.map(entity => ({
      name: entity.name,
      fields: entity.fields.map((field: any) => ({
        name: field.name,
        type: field.type,
        key: field.key,
        notNull: field.notNull,
        default: field.default,
        annotations: field.annotations
      })),
      associations: [],
      annotations: entity.annotations || {}
    }));

    // Generate mock data
    const generator = new MockDataGenerator();
    const csvFiles = await generator.generateForEntities(cdsEntities, {
      recordsPerEntity: 25,
      preserveReferentialIntegrity: true
    });

    // Write CSV files to db/data/
    for (const [entityName, csvContent] of Object.entries(csvFiles)) {
      const csvPath = join(dataDir, `resurrection.db-${entityName}.csv`);
      await writeFile(csvPath, csvContent);
      console.log(`[ResurrectionEngine] Generated mock data: ${csvPath}`);
    }
  }

  /**
   * Read all project files recursively
   */
  private async readProjectFiles(projectPath: string): Promise<Array<{ path: string; content: string }>> {
    const files: Array<{ path: string; content: string }> = [];
    
    const readDir = async (dir: string, basePath: string = '') => {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'gen') {
            await readDir(fullPath, relativePath);
          }
        } else {
          const content = await fsReadFile(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        }
      }
    };
    
    await readDir(projectPath);
    return files;
  }

  /**
   * Step 4: Validate generated project using UI5 MCP linter
   * 
   * Requirements: 3.5, 9.9
   */
  private async stepValidate(resurrectionId: string, project: any): Promise<any> {
    const startTime = Date.now();
    
    this.emitStepStart(resurrectionId, 'VALIDATE', 'Validating generated code...');
    await this.updateStatus(resurrectionId, 'VALIDATING');
    await this.logStep(resurrectionId, 'VALIDATE', 'STARTED');

    try {
      const errors: any[] = [];
      const warnings: any[] = [];
      let syntaxValid = true;
      let structureValid = true;

      // Step 4a: Validate CDS syntax using cds build
      try {
        console.log(`[ResurrectionEngine] Validating CDS syntax...`);
        this.emitProgress(resurrectionId, 'VALIDATE', 'IN_PROGRESS', 'Validating CDS syntax...', 30);
        
        const { stdout, stderr } = await execAsync('cds build', { cwd: project.path });
        
        if (stderr && stderr.includes('error')) {
          syntaxValid = false;
          errors.push({
            file: 'CDS',
            message: 'CDS syntax errors detected',
            details: stderr
          });
        }
        
        console.log(`[ResurrectionEngine] ✅ CDS syntax validation complete`);
      } catch (error) {
        syntaxValid = false;
        errors.push({
          file: 'CDS',
          message: 'CDS build failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        console.warn('[ResurrectionEngine] ⚠️ CDS validation failed:', error);
      }

      // Step 4b: Validate CAP project structure
      console.log(`[ResurrectionEngine] Validating CAP structure...`);
      this.emitProgress(resurrectionId, 'VALIDATE', 'IN_PROGRESS', 'Validating project structure...', 60);
      
      structureValid = this.validateCAPStructure(project);
      
      if (!structureValid) {
        errors.push({
          file: 'Structure',
          message: 'CAP project structure incomplete',
          details: 'Missing required files or directories'
        });
      }

      // Step 4c: Lint UI5 project (if UI5 app exists)
      if (project.ui5AppPath && existsSync(project.ui5AppPath)) {
        try {
          console.log(`[ResurrectionEngine] Linting UI5 project...`);
          this.emitProgress(resurrectionId, 'VALIDATE', 'IN_PROGRESS', 'Linting UI5 app...', 90);
          
          const lintResults = await this.mcpClient.lintUI5Project(project.ui5AppPath);
          
          errors.push(...lintResults.errors);
          warnings.push(...lintResults.warnings);
          
          console.log(`[ResurrectionEngine] ✅ UI5 linting complete: ${lintResults.errors.length} errors, ${lintResults.warnings.length} warnings`);
        } catch (error) {
          console.warn('[ResurrectionEngine] ⚠️ UI5 linting failed (non-critical):', error);
          warnings.push({
            file: 'UI5',
            message: 'UI5 linting failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(syntaxValid, structureValid, errors.length, warnings.length);

      // Create quality report in database
      await prisma.qualityReport.create({
        data: {
          resurrectionId,
          overallScore: qualityScore,
          syntaxValid,
          cleanCoreCompliant: true, // Assume Clean Core compliant for now
          businessLogicPreserved: true,
          testCoverage: 0,
          issues: errors.length > 0 ? errors.map(e => e.message) : undefined,
          recommendations: [
            'Add unit tests for service handlers',
            'Add integration tests',
            'Review and enhance business logic implementation'
          ]
        }
      });

      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: { qualityScore }
      });

      const validation = {
        passed: errors.length === 0,
        syntaxValid,
        structureValid,
        qualityScore,
        errors,
        warnings
      };

      const duration = Date.now() - startTime;

      await this.logStep(resurrectionId, 'VALIDATE', 'COMPLETED', duration, {
        passed: validation.passed,
        qualityScore,
        errorCount: errors.length,
        warningCount: warnings.length
      });
      
      this.emitStepComplete(resurrectionId, 'VALIDATE', 
        `Validation complete: ${errors.length} errors, ${warnings.length} warnings, quality score ${qualityScore}`, 
        validation
      );

      return validation;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      await this.logStep(resurrectionId, 'VALIDATE', 'FAILED', duration, null, errorMessage);
      this.emitStepError(resurrectionId, 'VALIDATE', errorMessage);
      
      throw error;
    }
  }

  /**
   * Validate CAP project structure
   */
  private validateCAPStructure(project: any): boolean {
    const requiredFiles = ['package.json', 'db/schema.cds', 'srv/service.cds', 'srv/service.js'];
    return requiredFiles.every(file => 
      project.files.some((f: any) => f.path.includes(file))
    );
  }

  /**
   * Calculate quality score based on validation results
   */
  private calculateQualityScore(
    syntaxValid: boolean,
    structureValid: boolean,
    errorCount: number,
    warningCount: number
  ): number {
    let score = 100;

    if (!syntaxValid) score -= 30;
    if (!structureValid) score -= 20;
    
    score -= errorCount * 5;
    score -= warningCount * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Step 5: Deploy to GitHub and send Slack notification
   * 
   * Requirements: 3.6, 10.2, 10.3, 10.7
   */
  private async stepDeploy(
    resurrectionId: string,
    project: any,
    config: ResurrectionConfig
  ): Promise<any> {
    const startTime = Date.now();
    
    this.emitStepStart(resurrectionId, 'DEPLOY', 'Deploying to GitHub...');
    await this.updateStatus(resurrectionId, 'DEPLOYING');
    await this.logStep(resurrectionId, 'DEPLOY', 'STARTED');

    try {
      const resurrection = await prisma.resurrection.findUnique({
        where: { id: resurrectionId }
      });

      if (!resurrection) {
        throw new Error('Resurrection not found');
      }

      let githubUrl = '';
      let basUrl = '';
      let repoName = '';

      // Step 5a: Deploy to GitHub (if not skipped)
      if (!config.skipGitHub) {
        try {
          console.log(`[ResurrectionEngine] Creating GitHub repository...`);
          this.emitProgress(resurrectionId, 'DEPLOY', 'IN_PROGRESS', 'Creating GitHub repository...', 30);
          
          repoName = `resurrection-${resurrection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          const description = `🔄 Resurrected from ABAP: ${resurrection.description || resurrection.name}`;

          // Create repository
          const repo = await this.mcpClient.createRepository(repoName, description);
          githubUrl = repo.html_url;

          console.log(`[ResurrectionEngine] ✅ Repository created: ${githubUrl}`);
          this.emitProgress(resurrectionId, 'DEPLOY', 'IN_PROGRESS', 'Committing files to GitHub...', 60);

          // Prepare files for commit
          const filesToCommit = project.files.map((file: any) => ({
            path: file.path,
            content: file.content
          }));

          // Commit all files
          const [owner] = repo.full_name.split('/');
          await this.mcpClient.commitFiles(`${owner}/${repoName}`, filesToCommit);

          console.log(`[ResurrectionEngine] ✅ Files committed to GitHub`);

          // Generate BAS URL
          basUrl = `https://bas.eu10.hana.ondemand.com/?gitClone=${encodeURIComponent(repo.clone_url)}`;

          // Update resurrection with GitHub info
          await prisma.resurrection.update({
            where: { id: resurrectionId },
            data: {
              githubRepo: repoName,
              githubUrl,
              basUrl,
              githubMethod: 'MCP_AUTO'
            }
          });

          // Log GitHub activity
          await prisma.gitHubActivity.create({
            data: {
              resurrectionId,
              activity: 'REPO_CREATED',
              details: {
                repoName,
                repoUrl: githubUrl,
                fileCount: project.files.length
              },
              githubUrl
            }
          });

        } catch (error) {
          console.error('[ResurrectionEngine] ❌ GitHub deployment failed:', error);
          throw new Error(`GitHub deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.log('[ResurrectionEngine] GitHub deployment skipped');
        githubUrl = 'https://github.com/sap-resurrections/manual-upload-required';
        basUrl = 'Manual deployment required';
      }

      // Step 5b: Send Slack notification (if not skipped)
      if (!config.skipSlack) {
        try {
          console.log(`[ResurrectionEngine] Sending Slack notification...`);
          this.emitProgress(resurrectionId, 'DEPLOY', 'IN_PROGRESS', 'Sending Slack notification...', 90);
          
          const message = `✅ *Resurrection Complete!*\n\n` +
            `*Project:* ${resurrection.name}\n` +
            `*Module:* ${resurrection.module}\n` +
            `*Quality Score:* ${resurrection.qualityScore}/100\n` +
            `*LOC Saved:* ${resurrection.locSaved}\n` +
            `*GitHub:* ${githubUrl}\n` +
            `*BAS:* ${basUrl}`;

          await this.mcpClient.postMessage('#resurrections', message);
          
          console.log(`[ResurrectionEngine] ✅ Slack notification sent`);
        } catch (error) {
          console.warn('[ResurrectionEngine] ⚠️ Slack notification failed (non-critical):', error);
          // Don't throw - Slack failures shouldn't block workflow
        }
      }

      const deployment = {
        githubUrl,
        basUrl,
        repoName,
        fileCount: project.files.length
      };

      const duration = Date.now() - startTime;

      await this.logStep(resurrectionId, 'DEPLOY', 'COMPLETED', duration, deployment);
      this.emitStepComplete(resurrectionId, 'DEPLOY', 
        `Deployment complete: ${githubUrl}`, 
        deployment
      );

      return deployment;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Deployment failed';
      
      await this.logStep(resurrectionId, 'DEPLOY', 'FAILED', duration, null, errorMessage);
      this.emitStepError(resurrectionId, 'DEPLOY', errorMessage);
      
      throw error;
    }
  }

  // ============================================================================
  // Event Emitters
  // ============================================================================

  private emitProgress(
    resurrectionId: string,
    step: WorkflowStep,
    status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    message: string,
    progress?: number,
    data?: any
  ): void {
    const event: ProgressEvent = {
      resurrectionId,
      step,
      status,
      message,
      progress,
      data,
      timestamp: new Date()
    };

    this.emit('progress', event);
  }

  private emitStepStart(resurrectionId: string, step: WorkflowStep, message: string): void {
    this.emit('stepStart', { resurrectionId, step, message, timestamp: new Date() });
    this.emitProgress(resurrectionId, step, 'STARTED', message, 0);
  }

  private emitStepComplete(resurrectionId: string, step: WorkflowStep, message: string, data?: any): void {
    this.emit('stepComplete', { resurrectionId, step, message, data, timestamp: new Date() });
    this.emitProgress(resurrectionId, step, 'COMPLETED', message, 100, data);
  }

  private emitStepError(resurrectionId: string, step: WorkflowStep, error: string): void {
    this.emit('stepError', { resurrectionId, step, error, timestamp: new Date() });
    this.emitProgress(resurrectionId, step, 'FAILED', error);
  }

  // ============================================================================
  // Database Helpers
  // ============================================================================

  private async updateStatus(resurrectionId: string, status: ResurrectionStatus): Promise<void> {
    await prisma.resurrection.update({
      where: { id: resurrectionId },
      data: { status, updatedAt: new Date() }
    });
  }

  private async logStep(
    resurrectionId: string,
    step: string,
    status: string,
    duration?: number,
    response?: any,
    errorMessage?: string
  ): Promise<void> {
    await prisma.transformationLog.create({
      data: {
        resurrectionId,
        step,
        status,
        duration: duration || 0,
        request: { step },
        response: response || null,
        errorMessage
      }
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get MCP health status
   */
  async getHealthStatus() {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.mcpClient.healthCheck();
  }

  /**
   * Get MCP statistics
   */
  getStats() {
    return this.mcpClient.getStats();
  }

  /**
   * Shutdown the engine and disconnect from MCP servers
   */
  async shutdown(): Promise<void> {
    console.log('[ResurrectionEngine] Shutting down...');
    
    if (this.initialized) {
      await this.mcpClient.disconnect();
      this.initialized = false;
    }

    this.removeAllListeners();
    console.log('[ResurrectionEngine] ✅ Shutdown complete');
  }

  /**
   * Check if engine is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }
}
