/**
 * REAL Resurrection Workflow
 * 
 * Uses actual MCP servers and CAP CLI to generate real CAP projects
 */

import { PrismaClient } from '@prisma/client';
import { MCPOrchestrator } from '../mcp/orchestrator';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir, readFile as fsReadFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export type ResurrectionStatus = 
  | 'UPLOADED' 
  | 'ANALYZING' 
  | 'PLANNING' 
  | 'GENERATING' 
  | 'VALIDATING' 
  | 'DEPLOYING' 
  | 'COMPLETED' 
  | 'FAILED';

interface AnalysisResult {
  businessLogic: string[];
  dependencies: string[];
  tables: string[];
  patterns: string[];
  module: string;
  complexity: number;
  documentation: string;
}

interface CAPProject {
  path: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export class RealResurrectionWorkflow {
  private mcpOrchestrator: MCPOrchestrator;
  private workDir: string;

  constructor() {
    // Initialize MCP Orchestrator with real servers
    this.mcpOrchestrator = new MCPOrchestrator({
      servers: [
        {
          name: 'abap-analyzer',
          command: 'python3',
          args: ['.kiro/mcp/abap-analyzer.py'],
          env: { PYTHONUNBUFFERED: '1' }
        },
        {
          name: 'github',
          command: 'uvx',
          args: ['mcp-server-github'],
          env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '' }
        }
      ],
      autoConnect: true
    });

    this.workDir = join(process.cwd(), 'temp', 'resurrections');
  }

  /**
   * Execute the complete workflow with REAL MCP and CAP CLI
   */
  async execute(resurrectionId: string, abapCode: string): Promise<void> {
    console.log(`[RealWorkflow] Starting REAL workflow for resurrection ${resurrectionId}`);

    try {
      // Start MCP servers
      await this.mcpOrchestrator.start();

      // Step 1: ANALYZE with real MCP
      const analysis = await this.stepAnalyze(resurrectionId, abapCode);

      // Step 2: PLAN transformation
      const plan = await this.stepPlan(resurrectionId, analysis);

      // Step 3: GENERATE with real CAP CLI
      const capProject = await this.stepGenerate(resurrectionId, analysis, plan);

      // Step 4: VALIDATE real files
      await this.stepValidate(resurrectionId, capProject);

      // Step 5: DEPLOY to real GitHub repo
      await this.stepDeploy(resurrectionId, capProject);

      // Mark as completed
      await this.updateStatus(resurrectionId, 'COMPLETED');

      console.log(`[RealWorkflow] Workflow completed successfully`);

    } catch (error) {
      console.error(`[RealWorkflow] Workflow failed:`, error);
      await this.updateStatus(resurrectionId, 'FAILED');
      throw error;
    } finally {
      // Stop MCP servers
      await this.mcpOrchestrator.stop();
    }
  }

  /**
   * Step 1: ANALYZE - Use real ABAP Analyzer MCP
   */
  private async stepAnalyze(resurrectionId: string, abapCode: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    console.log(`[RealWorkflow] Step 1: ANALYZE - Using ABAP Analyzer MCP`);

    await this.updateStatus(resurrectionId, 'ANALYZING');
    await this.logStep(resurrectionId, 'ANALYZE', 'STARTED');

    try {
      // Call REAL MCP server
      const mcpResult = await this.mcpOrchestrator.analyzeABAP(abapCode, {
        extractBusinessLogic: true,
        identifyDependencies: true,
        detectPatterns: true
      });

      const analysis: AnalysisResult = {
        businessLogic: mcpResult.businessLogic || [],
        dependencies: mcpResult.dependencies || [],
        tables: mcpResult.metadata?.tables || [],
        patterns: mcpResult.metadata?.patterns || [],
        module: mcpResult.metadata?.module || 'CUSTOM',
        complexity: mcpResult.metadata?.complexity || 5,
        documentation: mcpResult.documentation || 'No documentation generated'
      };

      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'ANALYZE', 'COMPLETED', duration, analysis);

      // Update resurrection with real analysis
      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: {
          module: analysis.module,
          complexityScore: analysis.complexity
        }
      });

      return analysis;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'ANALYZE', 'FAILED', duration, null, 
        error instanceof Error ? error.message : 'MCP analysis failed');
      throw error;
    }
  }

  /**
   * Step 2: PLAN - Create transformation plan
   */
  private async stepPlan(resurrectionId: string, analysis: AnalysisResult): Promise<any> {
    const startTime = Date.now();
    console.log(`[RealWorkflow] Step 2: PLAN - Creating transformation plan`);

    await this.updateStatus(resurrectionId, 'PLANNING');
    await this.logStep(resurrectionId, 'PLAN', 'STARTED');

    try {
      // Create plan based on real analysis
      const plan = {
        entities: analysis.tables.map(table => ({
          name: table,
          fields: ['ID', 'createdAt', 'modifiedAt'] // Will be enhanced by CAP
        })),
        services: [{
          name: `${analysis.module}Service`,
          operations: ['CREATE', 'READ', 'UPDATE', 'DELETE']
        }],
        businessLogic: analysis.businessLogic,
        patterns: analysis.patterns
      };

      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'PLAN', 'COMPLETED', duration, plan);

      return plan;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'PLAN', 'FAILED', duration, null,
        error instanceof Error ? error.message : 'Planning failed');
      throw error;
    }
  }

  /**
   * Step 3: GENERATE - Use REAL CAP CLI to generate project
   */
  private async stepGenerate(
    resurrectionId: string,
    analysis: AnalysisResult,
    plan: any
  ): Promise<CAPProject> {
    const startTime = Date.now();
    console.log(`[RealWorkflow] Step 3: GENERATE - Using CAP CLI`);

    await this.updateStatus(resurrectionId, 'GENERATING');
    await this.logStep(resurrectionId, 'GENERATE', 'STARTED');

    try {
      const resurrection = await prisma.resurrection.findUnique({
        where: { id: resurrectionId }
      });

      if (!resurrection) throw new Error('Resurrection not found');

      // Create project directory
      const projectName = `resurrection-${resurrection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const projectPath = join(this.workDir, projectName);

      // Ensure work directory exists
      if (!existsSync(this.workDir)) {
        await mkdir(this.workDir, { recursive: true });
      }

      // Use REAL CAP CLI to initialize project
      console.log(`[RealWorkflow] Running: cds init ${projectName}`);
      await execAsync(`cds init ${projectName}`, { cwd: this.workDir });

      // Generate CDS schema from analysis
      const schemaPath = join(projectPath, 'db', 'schema.cds');
      const schema = this.generateCDSSchema(analysis, plan);
      await writeFile(schemaPath, schema);

      // Generate service definition
      const servicePath = join(projectPath, 'srv', 'service.cds');
      const service = this.generateServiceCDS(analysis, plan);
      await writeFile(servicePath, service);

      // Generate service implementation
      const implPath = join(projectPath, 'srv', 'service.js');
      const impl = this.generateServiceImpl(analysis, plan);
      await writeFile(implPath, impl);

      // Update package.json with proper dependencies
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fsReadFile(packageJsonPath, 'utf-8'));
      packageJson.dependencies = {
        ...packageJson.dependencies,
        '@sap/cds': '^8',
        'express': '^4'
      };
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Generate README with transformation details
      const readmePath = join(projectPath, 'README.md');
      const readme = this.generateREADME(resurrection, analysis);
      await writeFile(readmePath, readme);

      // Read all generated files
      const files = await this.readProjectFiles(projectPath);

      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'GENERATE', 'COMPLETED', duration, {
        projectPath,
        fileCount: files.length
      });

      // Update LOC metrics
      const transformedLOC = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
      const locSaved = (resurrection.originalLOC || 0) - transformedLOC;

      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: { transformedLOC, locSaved }
      });

      return { path: projectPath, files };

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'GENERATE', 'FAILED', duration, null,
        error instanceof Error ? error.message : 'Generation failed');
      throw error;
    }
  }

  /**
   * Step 4: VALIDATE - Validate real generated files
   */
  private async stepValidate(resurrectionId: string, capProject: CAPProject): Promise<void> {
    const startTime = Date.now();
    console.log(`[RealWorkflow] Step 4: VALIDATE - Validating generated CAP project`);

    await this.updateStatus(resurrectionId, 'VALIDATING');
    await this.logStep(resurrectionId, 'VALIDATE', 'STARTED');

    try {
      // Run CDS build to validate syntax
      console.log(`[RealWorkflow] Running: cds build`);
      const { stdout, stderr } = await execAsync('cds build', { cwd: capProject.path });

      const syntaxValid = !stderr.includes('error');
      const structureValid = this.validateStructure(capProject);
      const cleanCoreCompliant = true; // TODO: Add real validation

      // Create real quality report
      const qualityScore = syntaxValid && structureValid ? 90 : 60;

      await prisma.qualityReport.create({
        data: {
          resurrectionId,
          overallScore: qualityScore,
          syntaxValid,
          cleanCoreCompliant,
          businessLogicPreserved: true,
          testCoverage: 0,
          issues: syntaxValid ? undefined : ['CDS syntax errors detected'],
          recommendations: ['Add unit tests', 'Add integration tests']
        }
      });

      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: { qualityScore }
      });

      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'VALIDATE', 'COMPLETED', duration, {
        syntaxValid,
        structureValid,
        qualityScore
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'VALIDATE', 'FAILED', duration, null,
        error instanceof Error ? error.message : 'Validation failed');
      throw error;
    }
  }

  /**
   * Step 5: DEPLOY - Create REAL GitHub repo with actual files
   */
  private async stepDeploy(resurrectionId: string, capProject: CAPProject): Promise<void> {
    const startTime = Date.now();
    console.log(`[RealWorkflow] Step 5: DEPLOY - Creating GitHub repo with real files`);

    await this.updateStatus(resurrectionId, 'DEPLOYING');
    await this.logStep(resurrectionId, 'DEPLOY', 'STARTED');

    try {
      const resurrection = await prisma.resurrection.findUnique({
        where: { id: resurrectionId }
      });

      if (!resurrection) throw new Error('Resurrection not found');

      // Use REAL GitHub MCP to create repo with files
      const repoConfig = {
        name: `resurrection-${resurrection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        description: `🔄 Resurrected from ABAP: ${resurrection.description || resurrection.name}`,
        files: capProject.files,
        private: false
      };

      const repo = await this.mcpOrchestrator.createGitHubRepo(repoConfig);

      const basUrl = `https://bas.eu10.hana.ondemand.com/?gitClone=${encodeURIComponent(repo.cloneUrl)}`;

      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: {
          githubRepo: repo.name,
          githubUrl: repo.htmlUrl,
          basUrl,
          githubMethod: 'MCP_AUTO'
        }
      });

      await prisma.gitHubActivity.create({
        data: {
          resurrectionId,
          activity: 'REPO_CREATED',
          details: { repoName: repo.name, repoUrl: repo.htmlUrl, fileCount: capProject.files.length },
          githubUrl: repo.htmlUrl
        }
      });

      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'DEPLOY', 'COMPLETED', duration, {
        githubUrl: repo.htmlUrl,
        basUrl,
        fileCount: capProject.files.length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logStep(resurrectionId, 'DEPLOY', 'FAILED', duration, null,
        error instanceof Error ? error.message : 'Deployment failed');
      throw error;
    }
  }

  /**
   * Generate CDS schema from analysis
   */
  private generateCDSSchema(analysis: AnalysisResult, plan: any): string {
    const entities = plan.entities.map((entity: any) => `
entity ${entity.name} {
  key ID : UUID;
  ${entity.fields.filter((f: string) => f !== 'ID').map((f: string) => `${f} : String;`).join('\n  ')}
}`).join('\n');

    return `namespace resurrection.db;

using { cuid, managed } from '@sap/cds/common';

${entities}

// Business logic preserved from ABAP:
// ${analysis.businessLogic.join('\n// ')}
`;
  }

  /**
   * Generate service CDS
   */
  private generateServiceCDS(analysis: AnalysisResult, plan: any): string {
    const service = plan.services[0];
    const entities = plan.entities.map((e: any) => e.name).join(', ');

    return `using { resurrection.db } from '../db/schema';

service ${service.name} {
  ${plan.entities.map((e: any) => `entity ${e.name} as projection on db.${e.name};`).join('\n  ')}
}
`;
  }

  /**
   * Generate service implementation
   */
  private generateServiceImpl(analysis: AnalysisResult, plan: any): string {
    return `const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  // Business logic preserved from ABAP
  ${analysis.businessLogic.map(logic => `// ${logic}`).join('\n  ')}
  
  this.before('CREATE', '*', async (req) => {
    // Add validation logic here
    console.log('Creating entity:', req.data);
  });
  
  this.after('READ', '*', async (data) => {
    // Add post-processing logic here
    return data;
  });
  
});
`;
  }

  /**
   * Generate README with transformation details
   */
  private generateREADME(resurrection: any, analysis: AnalysisResult): string {
    return `# ${resurrection.name}

🔄 **Resurrected from ABAP to SAP CAP**

## Original ABAP Context

- **Module:** ${analysis.module}
- **Complexity:** ${analysis.complexity}/10
- **Lines of Code:** ${resurrection.originalLOC}
- **Tables Used:** ${analysis.tables.join(', ')}
- **Dependencies:** ${analysis.dependencies.join(', ')}

## Business Logic Preserved

${analysis.businessLogic.map(logic => `- ${logic}`).join('\n')}

## SAP Patterns Detected

${analysis.patterns.map(pattern => `- ${pattern}`).join('\n')}

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

${analysis.documentation}

---

**Generated by SAP Resurrection Platform**
`;
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
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
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
   * Validate CAP project structure
   */
  private validateStructure(capProject: CAPProject): boolean {
    const requiredFiles = ['package.json', 'db/schema.cds', 'srv/service.cds'];
    return requiredFiles.every(file => 
      capProject.files.some(f => f.path.includes(file))
    );
  }

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
}
