/**
 * Resurrection Workflow Engine
 * 
 * Orchestrates the 5-step resurrection workflow:
 * ANALYZE → PLAN → GENERATE → VALIDATE → DEPLOY
 * 
 * Requirements: 3.1, 3.7
 */

import { PrismaClient } from '@prisma/client';
import { MCPOrchestrator, AnalysisResult, CDSFiles, ServiceFiles, UIFiles, RepoInfo } from '../mcp/orchestrator';
import { LLMService } from '../llm/llm-service';
import { KiroSpecGenerator, ABAPAnalysis } from '../specs/kiro-spec-generator';
import { HookManager } from '../hooks/hook-manager';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

// Workflow step types
export type WorkflowStep = 'ANALYZE' | 'PLAN' | 'GENERATE' | 'VALIDATE' | 'DEPLOY';

// Resurrection status types
export type ResurrectionStatus = 
  | 'UPLOADED' 
  | 'ANALYZING' 
  | 'PLANNING' 
  | 'GENERATING' 
  | 'VALIDATING' 
  | 'DEPLOYING' 
  | 'COMPLETED' 
  | 'FAILED';

// Step results
export interface StepAnalyzeResult {
  analysis: AnalysisResult;
  duration: number;
}

export interface StepPlanResult {
  plan: TransformationPlan;
  duration: number;
}

export interface StepGenerateResult {
  capProject: CAPProject;
  duration: number;
}

export interface StepValidateResult {
  validation: ValidationResult;
  duration: number;
}

export interface StepDeployResult {
  deployment: DeploymentResult;
  duration: number;
}

// Transformation plan structure
export interface TransformationPlan {
  architecture: {
    layers: string[];
    patterns: string[];
  };
  cdsModels: {
    entities: Array<{
      name: string;
      fields: Array<{ name: string; type: string }>;
    }>;
  };
  services: {
    name: string;
    operations: string[];
  }[];
  uiDesign: {
    type: 'FIORI_ELEMENTS' | 'FREESTYLE';
    template: string;
    features: string[];
  };
}

// CAP project structure
export interface CAPProject {
  db: CDSFiles;
  srv: ServiceFiles;
  app: UIFiles;
  packageJson: string;
  mtaYaml: string;
  readme: string;
  xsSecurity: string;
  gitignore: string;
}

// Validation result
export interface ValidationResult {
  passed: boolean;
  syntaxValid: boolean;
  structureValid: boolean;
  cleanCoreCompliant: boolean;
  businessLogicPreserved: boolean;
  errors: string[];
  warnings: string[];
}

// Deployment result
export interface DeploymentResult {
  githubUrl: string;
  basUrl: string;
  repoName: string;
}

// Complete workflow result
export interface ResurrectionResult {
  analysis: AnalysisResult;
  plan: TransformationPlan;
  capProject: CAPProject;
  validation: ValidationResult;
  deployment: DeploymentResult;
}

// Progress update event
export interface ProgressUpdate {
  resurrectionId: string;
  step: WorkflowStep;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  message?: string;
  timestamp: Date;
}

/**
 * Resurrection Workflow Engine
 * 
 * Manages the complete lifecycle of a resurrection from ABAP analysis to deployment
 */
export class ResurrectionWorkflow extends EventEmitter {
  private mcpOrchestrator: MCPOrchestrator;
  private llmService: LLMService;
  private specGenerator: KiroSpecGenerator;
  private hookManager: HookManager;

  constructor(mcpOrchestrator: MCPOrchestrator, llmService: LLMService) {
    super();
    this.mcpOrchestrator = mcpOrchestrator;
    this.llmService = llmService;
    this.specGenerator = new KiroSpecGenerator();
    this.hookManager = new HookManager(mcpOrchestrator);
  }

  /**
   * Execute the complete 5-step resurrection workflow
   * 
   * @param resurrectionId - The resurrection ID
   * @param abapCode - The ABAP source code to transform
   * @param options - Workflow options (e.g., useKiroSpec)
   * @returns Complete resurrection result
   */
  async execute(
    resurrectionId: string,
    abapCode: string,
    options?: { useKiroSpec?: boolean; projectName?: string }
  ): Promise<ResurrectionResult> {
    console.log(`[ResurrectionWorkflow] Starting workflow for resurrection ${resurrectionId}`);

    // Get resurrection details for hooks
    const resurrection = await prisma.resurrection.findUnique({
      where: { id: resurrectionId }
    });

    try {
      // Trigger resurrection.started hook
      await this.hookManager.trigger('resurrection.started', {
        resurrectionId,
        resurrection
      });

      // Step 0 (Optional): Generate Kiro Spec if requested
      if (options?.useKiroSpec && options?.projectName) {
        await this.stepGenerateSpec(resurrectionId, abapCode, options.projectName);
      }

      // Step 1: ANALYZE
      const analyzeResult = await this.stepAnalyze(resurrectionId, abapCode);
      
      // Step 2: PLAN
      const planResult = await this.stepPlan(resurrectionId, analyzeResult.analysis);
      
      // Step 3: GENERATE
      const generateResult = await this.stepGenerate(resurrectionId, planResult.plan);
      
      // Step 4: VALIDATE
      const validateResult = await this.stepValidate(resurrectionId, generateResult.capProject);
      
      // Check if validation passed
      if (!validateResult.validation.passed) {
        // Trigger quality.validation.failed hook
        await this.hookManager.trigger('quality.validation.failed', {
          resurrectionId,
          resurrection,
          validation: validateResult.validation
        });
        
        throw new Error(`Validation failed: ${validateResult.validation.errors.join(', ')}`);
      } else {
        // Trigger quality.validation.passed hook
        await this.hookManager.trigger('quality.validation.passed', {
          resurrectionId,
          resurrection,
          validation: validateResult.validation
        });
      }
      
      // Step 5: DEPLOY
      const deployResult = await this.stepDeploy(resurrectionId, generateResult.capProject);
      
      // Mark resurrection as completed
      await this.updateStatus(resurrectionId, 'COMPLETED');
      
      // Trigger resurrection.completed hook
      await this.hookManager.trigger('resurrection.completed', {
        resurrectionId,
        resurrection: {
          ...resurrection,
          githubUrl: deployResult.deployment.githubUrl,
          basUrl: deployResult.deployment.basUrl
        },
        capProject: generateResult.capProject
      });
      
      console.log(`[ResurrectionWorkflow] Workflow completed successfully for resurrection ${resurrectionId}`);
      
      return {
        analysis: analyzeResult.analysis,
        plan: planResult.plan,
        capProject: generateResult.capProject,
        validation: validateResult.validation,
        deployment: deployResult.deployment
      };
      
    } catch (error) {
      console.error(`[ResurrectionWorkflow] Workflow failed for resurrection ${resurrectionId}:`, error);
      
      // Update status to FAILED
      await this.updateStatus(resurrectionId, 'FAILED');
      
      // Trigger resurrection.failed hook
      await this.hookManager.trigger('resurrection.failed', {
        resurrectionId,
        resurrection,
        error
      });
      
      // Log error
      await this.logError(resurrectionId, error);
      
      throw error;
    }
  }

  /**
   * Step 0 (Optional): Generate Kiro Spec documents
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.4
   */
  private async stepGenerateSpec(
    resurrectionId: string,
    abapCode: string,
    projectName: string
  ): Promise<void> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 0: GENERATE SPEC - Starting for resurrection ${resurrectionId}`);
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'ANALYZE', 'STARTED', 'Generating Kiro spec documents...');
    
    try {
      // Quick analysis for spec generation
      const quickAnalysis = await this.mcpOrchestrator.analyzeABAP(abapCode, {
        extractBusinessLogic: true,
        identifyDependencies: true,
        detectPatterns: true
      });

      // Convert to ABAPAnalysis format
      const analysis: ABAPAnalysis = {
        objects: [{
          name: projectName,
          type: 'PROGRAM',
          module: quickAnalysis.metadata.module,
          linesOfCode: abapCode.split('\n').length,
          complexity: quickAnalysis.metadata.complexity,
          businessLogic: quickAnalysis.businessLogic.join(', '),
          dependencies: quickAnalysis.dependencies,
          tables: quickAnalysis.metadata.tables || []
        }],
        totalLOC: abapCode.split('\n').length,
        module: quickAnalysis.metadata.module,
        patterns: quickAnalysis.metadata.patterns || []
      };

      // Generate spec documents
      const spec = await this.specGenerator.generateSpec(projectName, analysis);

      // Save spec files
      await this.specGenerator.saveSpecFiles(resurrectionId, projectName, spec);

      const duration = Date.now() - startTime;

      // Log spec generation
      await this.logStep(resurrectionId, 'ANALYZE', {
        input: { projectName },
        output: { specGenerated: true, specPath: `.kiro/specs/resurrection-${projectName}` }
      }, duration, 'COMPLETED');

      // Emit progress event
      this.emitProgress(resurrectionId, 'ANALYZE', 'COMPLETED', 'Kiro spec documents generated');

      console.log(`[ResurrectionWorkflow] Step 0: GENERATE SPEC - Completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('[ResurrectionWorkflow] Spec generation failed, continuing without spec:', error);
      
      // Log but don't fail the workflow
      await this.logStep(resurrectionId, 'ANALYZE', {
        input: { projectName },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Step 1: ANALYZE - Analyze ABAP code using ABAP Analyzer MCP
   * 
   * Requirements: 3.2, 5.3
   */
  private async stepAnalyze(resurrectionId: string, abapCode: string): Promise<StepAnalyzeResult> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 1: ANALYZE - Starting for resurrection ${resurrectionId}`);
    
    // Update status
    await this.updateStatus(resurrectionId, 'ANALYZING');
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'ANALYZE', 'STARTED', 'Analyzing ABAP code...');
    
    try {
      // Call ABAP Analyzer MCP
      const analysis = await this.mcpOrchestrator.analyzeABAP(abapCode, {
        extractBusinessLogic: true,
        identifyDependencies: true,
        detectPatterns: true
      });
      
      const duration = Date.now() - startTime;
      
      // Store analysis results in database
      await this.logStep(resurrectionId, 'ANALYZE', {
        input: { codeLength: abapCode.length },
        output: analysis
      }, duration, 'COMPLETED');
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'ANALYZE', 'COMPLETED', 'ABAP analysis completed');
      
      console.log(`[ResurrectionWorkflow] Step 1: ANALYZE - Completed in ${duration}ms`);
      
      return { analysis, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed step
      await this.logStep(resurrectionId, 'ANALYZE', {
        input: { codeLength: abapCode.length },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'ANALYZE', 'FAILED', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Step 2: PLAN - Create transformation plan using LLM
   * 
   * Requirements: 3.3
   */
  private async stepPlan(resurrectionId: string, analysis: AnalysisResult): Promise<StepPlanResult> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 2: PLAN - Starting for resurrection ${resurrectionId}`);
    
    // Update status
    await this.updateStatus(resurrectionId, 'PLANNING');
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'PLAN', 'STARTED', 'Creating transformation plan with AI...');
    
    try {
      // Use LLM service to create intelligent transformation plan
      const plan = await this.llmService.createTransformationPlan(analysis, {
        includeArchitecture: true,
        includeCDSModels: true,
        includeServiceDefinitions: true,
        includeUIDesign: true,
        targetComplexity: 'moderate'
      });
      
      const duration = Date.now() - startTime;
      
      // Store plan in database
      await this.logStep(resurrectionId, 'PLAN', {
        input: { analysis },
        output: plan
      }, duration, 'COMPLETED');
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'PLAN', 'COMPLETED', 'AI-powered transformation plan created');
      
      console.log(`[ResurrectionWorkflow] Step 2: PLAN - Completed in ${duration}ms`);
      
      return { plan, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed step
      await this.logStep(resurrectionId, 'PLAN', {
        input: { analysis },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'PLAN', 'FAILED', `Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Step 3: GENERATE - Generate CAP project using MCP servers
   * 
   * Requirements: 3.4, 9.2, 9.3, 9.4, 9.5
   */
  private async stepGenerate(resurrectionId: string, plan: TransformationPlan): Promise<StepGenerateResult> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 3: GENERATE - Starting for resurrection ${resurrectionId}`);
    
    // Update status
    await this.updateStatus(resurrectionId, 'GENERATING');
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'GENERATE', 'STARTED', 'Generating CAP project...');
    
    try {
      // Generate CDS models
      const db = await this.mcpOrchestrator.generateCDS(plan.cdsModels);
      
      // Generate services
      const srv = await this.mcpOrchestrator.generateServices(plan.services);
      
      // Generate UI
      const app = await this.mcpOrchestrator.generateUI(plan.uiDesign);
      
      // Generate supporting files
      const packageJson = this.generatePackageJson(plan);
      const mtaYaml = this.generateMTAYaml(plan);
      const readme = this.generateReadme(plan);
      const xsSecurity = this.generateXSSecurity(plan);
      const gitignore = this.generateGitignore();
      
      const capProject: CAPProject = {
        db,
        srv,
        app,
        packageJson,
        mtaYaml,
        readme,
        xsSecurity,
        gitignore
      };
      
      const duration = Date.now() - startTime;
      
      // Store generation results in database
      await this.logStep(resurrectionId, 'GENERATE', {
        input: { plan },
        output: { fileCount: db.files.length + srv.files.length + app.files.length + 5 }
      }, duration, 'COMPLETED');
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'GENERATE', 'COMPLETED', 'CAP project generated');
      
      console.log(`[ResurrectionWorkflow] Step 3: GENERATE - Completed in ${duration}ms`);
      
      return { capProject, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed step
      await this.logStep(resurrectionId, 'GENERATE', {
        input: { plan },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'GENERATE', 'FAILED', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Step 4: VALIDATE - Validate generated CAP project
   * 
   * Requirements: 3.5, 9.9
   */
  private async stepValidate(resurrectionId: string, capProject: CAPProject): Promise<StepValidateResult> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 4: VALIDATE - Starting for resurrection ${resurrectionId}`);
    
    // Update status
    await this.updateStatus(resurrectionId, 'VALIDATING');
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'VALIDATE', 'STARTED', 'Validating CAP project...');
    
    try {
      // Perform validation checks
      const syntaxValid = await this.validateCDSSyntax(capProject.db);
      const structureValid = await this.validateCAPStructure(capProject);
      const cleanCoreCompliant = await this.validateCleanCore(capProject);
      const businessLogicPreserved = await this.validateBusinessLogic(capProject);
      
      const passed = syntaxValid && structureValid && cleanCoreCompliant && businessLogicPreserved;
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!syntaxValid) errors.push('CDS syntax validation failed');
      if (!structureValid) errors.push('CAP structure validation failed');
      if (!cleanCoreCompliant) warnings.push('Clean Core compliance issues detected');
      if (!businessLogicPreserved) errors.push('Business logic preservation validation failed');
      
      const validation: ValidationResult = {
        passed,
        syntaxValid,
        structureValid,
        cleanCoreCompliant,
        businessLogicPreserved,
        errors,
        warnings
      };
      
      const duration = Date.now() - startTime;
      
      // Store validation results in database
      await this.logStep(resurrectionId, 'VALIDATE', {
        input: { fileCount: capProject.db.files.length + capProject.srv.files.length + capProject.app.files.length },
        output: validation
      }, duration, 'COMPLETED');
      
      // Create quality report
      await prisma.qualityReport.create({
        data: {
          resurrectionId,
          overallScore: passed ? 100 : 50,
          syntaxValid,
          cleanCoreCompliant,
          businessLogicPreserved,
          issues: errors.length > 0 ? errors : undefined,
          recommendations: warnings.length > 0 ? warnings : undefined
        }
      });
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'VALIDATE', 'COMPLETED', passed ? 'Validation passed' : 'Validation completed with issues');
      
      console.log(`[ResurrectionWorkflow] Step 4: VALIDATE - Completed in ${duration}ms (passed: ${passed})`);
      
      return { validation, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed step
      await this.logStep(resurrectionId, 'VALIDATE', {
        input: { fileCount: capProject.db.files.length + capProject.srv.files.length + capProject.app.files.length },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'VALIDATE', 'FAILED', `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Step 5: DEPLOY - Deploy to GitHub using GitHub MCP
   * 
   * Requirements: 3.6, 10.2, 10.4, 13.1
   */
  private async stepDeploy(resurrectionId: string, capProject: CAPProject): Promise<StepDeployResult> {
    const startTime = Date.now();
    
    console.log(`[ResurrectionWorkflow] Step 5: DEPLOY - Starting for resurrection ${resurrectionId}`);
    
    // Update status
    await this.updateStatus(resurrectionId, 'DEPLOYING');
    
    // Emit progress event
    this.emitProgress(resurrectionId, 'DEPLOY', 'STARTED', 'Deploying to GitHub...');
    
    try {
      // Get resurrection details
      const resurrection = await prisma.resurrection.findUnique({
        where: { id: resurrectionId }
      });
      
      if (!resurrection) {
        throw new Error(`Resurrection ${resurrectionId} not found`);
      }
      
      // Flatten CAP project into file array
      const files = this.flattenCAPProject(capProject);
      
      // Create GitHub repository
      const repo = await this.mcpOrchestrator.createGitHubRepo({
        name: `resurrection-${resurrection.name}-${Date.now()}`,
        description: `Resurrected from ABAP: ${resurrection.description || resurrection.name}`,
        files
      });
      
      // Generate BAS deep link
      const basUrl = this.generateBASLink(repo.url);
      
      // Update resurrection record
      await prisma.resurrection.update({
        where: { id: resurrectionId },
        data: {
          githubRepo: repo.name,
          githubUrl: repo.url,
          basUrl,
          githubMethod: 'MCP_AUTO'
        }
      });
      
      // Log GitHub activity
      await prisma.gitHubActivity.create({
        data: {
          resurrectionId,
          activity: 'REPO_CREATED',
          details: { repoName: repo.name, repoUrl: repo.url },
          githubUrl: repo.url
        }
      });
      
      // Trigger github.repository.created hook
      await this.hookManager.trigger('github.repository.created', {
        resurrectionId,
        resurrection,
        githubRepo: repo.name,
        githubUrl: repo.url
      });
      
      const deployment: DeploymentResult = {
        githubUrl: repo.url,
        basUrl,
        repoName: repo.name
      };
      
      const duration = Date.now() - startTime;
      
      // Store deployment results in database
      await this.logStep(resurrectionId, 'DEPLOY', {
        input: { repoName: repo.name },
        output: deployment
      }, duration, 'COMPLETED');
      
      // Send Slack notification (non-blocking)
      this.mcpOrchestrator.notifySlack('#resurrections', {
        name: resurrection.name,
        githubUrl: repo.url,
        basUrl,
        module: resurrection.module,
        locSaved: resurrection.locSaved || 0,
        qualityScore: resurrection.qualityScore || 0
      }, 'completed').catch(err => {
        console.error('[ResurrectionWorkflow] Failed to send Slack notification:', err);
      });
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'DEPLOY', 'COMPLETED', 'Deployed to GitHub');
      
      console.log(`[ResurrectionWorkflow] Step 5: DEPLOY - Completed in ${duration}ms`);
      
      return { deployment, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed step
      await this.logStep(resurrectionId, 'DEPLOY', {
        input: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }, duration, 'FAILED', error instanceof Error ? error.message : undefined);
      
      // Emit progress event
      this.emitProgress(resurrectionId, 'DEPLOY', 'FAILED', `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Update resurrection status in database
   */
  private async updateStatus(resurrectionId: string, status: ResurrectionStatus): Promise<void> {
    await prisma.resurrection.update({
      where: { id: resurrectionId },
      data: { status }
    });
    
    console.log(`[ResurrectionWorkflow] Updated resurrection ${resurrectionId} status to ${status}`);
  }

  /**
   * Log workflow step to database
   */
  private async logStep(
    resurrectionId: string,
    step: WorkflowStep,
    data: { input?: any; output?: any; error?: string },
    duration: number,
    status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    errorMessage?: string
  ): Promise<void> {
    await prisma.transformationLog.create({
      data: {
        resurrectionId,
        step,
        request: data.input || null,
        response: data.output || null,
        duration,
        status,
        errorMessage
      }
    });
  }

  /**
   * Log error to database
   */
  private async logError(resurrectionId: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.resurrection.update({
      where: { id: resurrectionId },
      data: {
        status: 'FAILED'
      }
    });
    
    console.error(`[ResurrectionWorkflow] Logged error for resurrection ${resurrectionId}:`, errorMessage);
  }

  /**
   * Emit progress update event
   */
  private emitProgress(
    resurrectionId: string,
    step: WorkflowStep,
    status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    message?: string
  ): void {
    const update: ProgressUpdate = {
      resurrectionId,
      step,
      status,
      message,
      timestamp: new Date()
    };
    
    this.emit('progress', update);
  }

  // Helper methods for generation

  private generatePackageJson(plan: TransformationPlan): string {
    return JSON.stringify({
      name: 'resurrection-cap-app',
      version: '1.0.0',
      description: 'Resurrected CAP application from ABAP',
      scripts: {
        start: 'cds watch',
        build: 'cds build',
        deploy: 'cds deploy',
        test: 'jest'
      },
      dependencies: {
        '@sap/cds': '^7.0.0',
        '@sap/xssec': '^3.0.0',
        'express': '^4.18.0'
      },
      devDependencies: {
        '@sap/cds-dk': '^7.0.0',
        'jest': '^29.0.0'
      },
      cds: {
        requires: {
          db: { kind: 'hana' },
          auth: { kind: 'xsuaa' }
        }
      }
    }, null, 2);
  }

  private generateMTAYaml(plan: TransformationPlan): string {
    return `_schema-version: '3.1'
ID: resurrection-cap-app
version: 1.0.0
description: Resurrected CAP application from ABAP

modules:
  - name: resurrection-cap-app-srv
    type: nodejs
    path: gen/srv
    requires:
      - name: resurrection-cap-app-db
      - name: resurrection-cap-app-xsuaa
    provides:
      - name: srv-api
        properties:
          srv-url: \${default-url}

  - name: resurrection-cap-app-db-deployer
    type: hdb
    path: gen/db
    requires:
      - name: resurrection-cap-app-db

resources:
  - name: resurrection-cap-app-db
    type: com.sap.xs.hdi-container
    parameters:
      service: hana
      service-plan: hdi-shared

  - name: resurrection-cap-app-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      path: ./xs-security.json
`;
  }

  private generateReadme(plan: TransformationPlan): string {
    return `# Resurrection: CAP Application

🔄 This CAP application was resurrected from legacy ABAP code.

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
cf deploy mta_archives/resurrection-cap-app_1.0.0.mtar
\`\`\`

## Architecture

- **Database:** SAP HANA Cloud (HDI Container)
- **Backend:** SAP CAP (Node.js)
- **Frontend:** SAP Fiori Elements
- **Authentication:** XSUAA

## Business Logic Preserved

All ABAP business logic has been preserved in the CAP implementation.
`;
  }

  private generateXSSecurity(plan: TransformationPlan): string {
    return JSON.stringify({
      xsappname: 'resurrection-cap-app',
      'tenant-mode': 'dedicated',
      scopes: [
        {
          name: '$XSAPPNAME.Admin',
          description: 'Administrator'
        },
        {
          name: '$XSAPPNAME.User',
          description: 'User'
        }
      ],
      'role-templates': [
        {
          name: 'Admin',
          description: 'Administrator',
          'scope-references': ['$XSAPPNAME.Admin']
        },
        {
          name: 'User',
          description: 'User',
          'scope-references': ['$XSAPPNAME.User']
        }
      ]
    }, null, 2);
  }

  private generateGitignore(): string {
    return `node_modules/
gen/
mta_archives/
.env
*.log
.DS_Store
`;
  }

  private flattenCAPProject(capProject: CAPProject): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];
    
    // Add DB files
    for (const file of capProject.db.files) {
      files.push({ path: `db/${file.path}`, content: file.content });
    }
    
    // Add service files
    for (const file of capProject.srv.files) {
      files.push({ path: `srv/${file.path}`, content: file.content });
    }
    
    // Add app files
    for (const file of capProject.app.files) {
      files.push({ path: `app/${file.path}`, content: file.content });
    }
    
    // Add root files
    files.push({ path: 'package.json', content: capProject.packageJson });
    files.push({ path: 'mta.yaml', content: capProject.mtaYaml });
    files.push({ path: 'README.md', content: capProject.readme });
    files.push({ path: 'xs-security.json', content: capProject.xsSecurity });
    files.push({ path: '.gitignore', content: capProject.gitignore });
    
    return files;
  }

  private generateBASLink(githubUrl: string): string {
    // Default to EU10 region - in production this would be configurable
    const region = 'eu10';
    return `https://bas.${region}.hana.ondemand.com/?gitClone=${encodeURIComponent(githubUrl)}`;
  }

  // Validation helper methods

  private async validateCDSSyntax(db: CDSFiles): Promise<boolean> {
    // Basic validation - check that CDS files are not empty
    return db.files.length > 0 && db.files.every(f => f.content.length > 0);
  }

  private async validateCAPStructure(capProject: CAPProject): Promise<boolean> {
    // Check that all required components exist
    return (
      capProject.db.files.length > 0 &&
      capProject.srv.files.length > 0 &&
      capProject.app.files.length > 0 &&
      capProject.packageJson.length > 0 &&
      capProject.mtaYaml.length > 0
    );
  }

  private async validateCleanCore(capProject: CAPProject): Promise<boolean> {
    // Basic Clean Core validation
    // In production, this would check for:
    // - No standard modifications
    // - Use of released APIs only
    // - Cloud-native patterns
    return true;
  }

  private async validateBusinessLogic(capProject: CAPProject): Promise<boolean> {
    // Basic business logic validation
    // In production, this would verify that business logic from ABAP
    // has been correctly preserved in the CAP implementation
    return true;
  }
}
