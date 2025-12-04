/**
 * LLM Service for Transformation Planning
 * 
 * Uses OpenAI with SAP domain knowledge to create intelligent transformation plans
 * from ABAP analysis results to CAP architecture.
 * 
 * Requirements: 3.3
 */

import { AnalysisResult } from '../mcp/orchestrator';
import { TransformationPlan } from '../workflow/resurrection-workflow';

/**
 * Configuration for LLM service
 */
export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Options for transformation plan creation
 */
export interface TransformationPlanOptions {
  includeArchitecture?: boolean;
  includeCDSModels?: boolean;
  includeServiceDefinitions?: boolean;
  includeUIDesign?: boolean;
  targetComplexity?: 'simple' | 'moderate' | 'complex';
}

/**
 * LLM Service for creating transformation plans
 * 
 * This service uses OpenAI to analyze ABAP code analysis results and generate
 * comprehensive transformation plans for converting to SAP CAP applications.
 */
export class LLMService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private baseUrl: string;

  constructor(config: LLMServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 4000;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Create a comprehensive transformation plan from ABAP analysis
   * 
   * This method uses OpenAI with SAP domain knowledge to:
   * 1. Analyze the ABAP code structure and business logic
   * 2. Design appropriate CDS models based on ABAP tables and structures
   * 3. Plan CAP service architecture
   * 4. Design Fiori UI based on ABAP screens/transactions
   * 
   * @param analysis - The ABAP analysis result from ABAP Analyzer MCP
   * @param options - Options for plan generation
   * @returns A comprehensive transformation plan
   */
  async createTransformationPlan(
    analysis: AnalysisResult,
    options: TransformationPlanOptions = {}
  ): Promise<TransformationPlan> {
    console.log('[LLMService] Creating transformation plan from analysis');

    // Set default options
    const opts = {
      includeArchitecture: options.includeArchitecture ?? true,
      includeCDSModels: options.includeCDSModels ?? true,
      includeServiceDefinitions: options.includeServiceDefinitions ?? true,
      includeUIDesign: options.includeUIDesign ?? true,
      targetComplexity: options.targetComplexity || 'moderate'
    };

    // Build the prompt with SAP domain knowledge
    const prompt = this.buildTransformationPrompt(analysis, opts);

    try {
      // Call OpenAI API
      const response = await this.callOpenAI(prompt);

      // Parse the response into a structured transformation plan
      const plan = this.parseTransformationPlan(response, analysis);

      console.log('[LLMService] Transformation plan created successfully');

      return plan;

    } catch (error) {
      console.error('[LLMService] Failed to create transformation plan:', error);
      
      // Fallback to basic plan if LLM fails
      console.log('[LLMService] Falling back to basic transformation plan');
      return this.createBasicPlan(analysis);
    }
  }

  /**
   * Build a comprehensive prompt for transformation planning
   * 
   * This includes:
   * - SAP domain knowledge
   * - ABAP analysis results
   * - Clean Core principles
   * - CAP best practices
   */
  private buildTransformationPrompt(
    analysis: AnalysisResult,
    options: TransformationPlanOptions
  ): string {
    const sapDomainKnowledge = this.getSAPDomainKnowledge();
    const cleanCorePrinciples = this.getCleanCorePrinciples();
    const capBestPractices = this.getCAPBestPractices();

    return `You are an expert SAP architect specializing in modernizing legacy ABAP code to SAP CAP applications.

${sapDomainKnowledge}

${cleanCorePrinciples}

${capBestPractices}

## ABAP Analysis Results

**Module:** ${analysis.metadata.module || 'Unknown'}
**Lines of Code:** ${analysis.metadata.linesOfCode || 0}
**Complexity:** ${analysis.metadata.complexity || 'Unknown'}

**Business Logic:**
${JSON.stringify(analysis.businessLogic, null, 2)}

**Dependencies:**
${JSON.stringify(analysis.dependencies, null, 2)}

**Tables Used:**
${analysis.metadata.tables?.join(', ') || 'None identified'}

**Patterns Detected:**
${analysis.metadata.patterns?.join(', ') || 'None identified'}

## Task

Create a comprehensive transformation plan to convert this ABAP code into a modern SAP CAP application.

Your plan must include:

1. **Architecture**: Define the layers (db, srv, app) and patterns to use
2. **CDS Models**: Design entities based on ABAP tables and structures
3. **Services**: Define CAP services with appropriate operations
4. **UI Design**: Specify Fiori Elements template and features

## Requirements

- Preserve ALL business logic exactly
- Follow Clean Core principles (no standard modifications, use released APIs)
- Use modern CAP patterns (OData V4, event-driven, stateless)
- Design for SAP BTP deployment
- Include proper authorization checks
- Target complexity: ${options.targetComplexity}

## Output Format

Respond with a JSON object following this exact structure:

\`\`\`json
{
  "architecture": {
    "layers": ["db", "srv", "app"],
    "patterns": ["CAP", "Fiori Elements", "Clean Core", "OData V4"]
  },
  "cdsModels": {
    "entities": [
      {
        "name": "EntityName",
        "fields": [
          { "name": "ID", "type": "UUID" },
          { "name": "fieldName", "type": "String" }
        ]
      }
    ]
  },
  "services": [
    {
      "name": "ServiceName",
      "operations": ["CREATE", "READ", "UPDATE", "DELETE"]
    }
  ],
  "uiDesign": {
    "type": "FIORI_ELEMENTS",
    "template": "List Report",
    "features": ["Search", "Filter", "Sort"]
  }
}
\`\`\`

Generate the transformation plan now:`;
  }

  /**
   * Call OpenAI API with the transformation prompt
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert SAP architect specializing in ABAP to CAP transformations. You always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    return data.choices[0].message.content;
  }

  /**
   * Parse OpenAI response into structured transformation plan
   */
  private parseTransformationPlan(
    response: string,
    analysis: AnalysisResult
  ): TransformationPlan {
    try {
      // Parse JSON response
      const parsed = JSON.parse(response);

      // Validate and structure the plan
      const plan: TransformationPlan = {
        architecture: {
          layers: parsed.architecture?.layers || ['db', 'srv', 'app'],
          patterns: parsed.architecture?.patterns || ['CAP', 'Fiori Elements', 'Clean Core']
        },
        cdsModels: {
          entities: parsed.cdsModels?.entities || this.generateDefaultEntities(analysis)
        },
        services: parsed.services || this.generateDefaultServices(analysis),
        uiDesign: {
          type: parsed.uiDesign?.type || 'FIORI_ELEMENTS',
          template: parsed.uiDesign?.template || 'List Report',
          features: parsed.uiDesign?.features || ['Search', 'Filter', 'Sort']
        }
      };

      return plan;

    } catch (error) {
      console.error('[LLMService] Failed to parse LLM response:', error);
      console.log('[LLMService] Raw response:', response);
      
      // Fallback to basic plan
      return this.createBasicPlan(analysis);
    }
  }

  /**
   * Create a basic transformation plan as fallback
   */
  private createBasicPlan(analysis: AnalysisResult): TransformationPlan {
    return {
      architecture: {
        layers: ['db', 'srv', 'app'],
        patterns: ['CAP', 'Fiori Elements', 'Clean Core', 'OData V4']
      },
      cdsModels: {
        entities: this.generateDefaultEntities(analysis)
      },
      services: this.generateDefaultServices(analysis),
      uiDesign: {
        type: 'FIORI_ELEMENTS',
        template: 'List Report',
        features: ['Search', 'Filter', 'Sort', 'Export']
      }
    };
  }

  /**
   * Generate default CDS entities from ABAP analysis
   */
  private generateDefaultEntities(analysis: AnalysisResult): Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }> {
    const entities: Array<{
      name: string;
      fields: Array<{ name: string; type: string }>;
    }> = [];

    // Generate entities from ABAP tables
    if (analysis.metadata.tables && analysis.metadata.tables.length > 0) {
      for (const table of analysis.metadata.tables) {
        entities.push({
          name: this.convertTableNameToEntity(table),
          fields: [
            { name: 'ID', type: 'UUID' },
            { name: 'createdAt', type: 'Timestamp' },
            { name: 'createdBy', type: 'String(255)' },
            { name: 'modifiedAt', type: 'Timestamp' },
            { name: 'modifiedBy', type: 'String(255)' }
          ]
        });
      }
    } else {
      // Default entity if no tables identified
      entities.push({
        name: `${analysis.metadata.module || 'Business'}Object`,
        fields: [
          { name: 'ID', type: 'UUID' },
          { name: 'name', type: 'String(255)' },
          { name: 'description', type: 'String(1000)' },
          { name: 'status', type: 'String(50)' },
          { name: 'createdAt', type: 'Timestamp' },
          { name: 'createdBy', type: 'String(255)' },
          { name: 'modifiedAt', type: 'Timestamp' },
          { name: 'modifiedBy', type: 'String(255)' }
        ]
      });
    }

    return entities;
  }

  /**
   * Generate default CAP services from ABAP analysis
   */
  private generateDefaultServices(analysis: AnalysisResult): Array<{
    name: string;
    operations: string[];
  }> {
    const module = analysis.metadata.module || 'Business';
    
    return [{
      name: `${module}Service`,
      operations: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH']
    }];
  }

  /**
   * Convert ABAP table name to CDS entity name
   * 
   * Examples:
   * - VBAK -> SalesOrder
   * - VBAP -> SalesOrderItem
   * - KNA1 -> Customer
   */
  private convertTableNameToEntity(tableName: string): string {
    // Common SAP table mappings
    const tableMap: Record<string, string> = {
      'VBAK': 'SalesOrder',
      'VBAP': 'SalesOrderItem',
      'KNA1': 'Customer',
      'LFA1': 'Vendor',
      'MARA': 'Material',
      'EKKO': 'PurchaseOrder',
      'EKPO': 'PurchaseOrderItem',
      'BKPF': 'AccountingDocument',
      'BSEG': 'AccountingDocumentItem'
    };

    return tableMap[tableName] || tableName;
  }

  /**
   * Get SAP domain knowledge for the prompt
   */
  private getSAPDomainKnowledge(): string {
    return `## SAP Domain Knowledge

**SAP Modules:**
- SD (Sales & Distribution): Order management, pricing, shipping
- MM (Materials Management): Procurement, inventory, warehouse
- FI (Financial Accounting): GL, AP, AR, asset accounting
- CO (Controlling): Cost centers, profit centers, internal orders
- HR (Human Resources): Payroll, personnel, org management
- PP (Production Planning): MRP, capacity planning, shop floor

**Common SAP Tables:**
- VBAK/VBAP: Sales orders
- KNA1: Customer master
- MARA: Material master
- EKKO/EKPO: Purchase orders
- BKPF/BSEG: Accounting documents

**SAP Patterns to Preserve:**
- Pricing procedures (condition-based)
- Authorization objects (security)
- Number ranges (ID generation)
- Batch processing (performance)`;
  }

  /**
   * Get Clean Core principles for the prompt
   */
  private getCleanCorePrinciples(): string {
    return `## Clean Core Principles

1. **Use SAP Standard First**: Leverage standard BAPIs and transactions
2. **Extend, Don't Modify**: Use extension points, never modify standard code
3. **Cloud-Ready**: ABAP Cloud for custom code, SAP CAP for new apps
4. **API-First**: Use OData services, RESTful APIs, standard integration patterns
5. **Released APIs Only**: Only use SAP-released APIs, avoid internal/undocumented APIs`;
  }

  /**
   * Get CAP best practices for the prompt
   */
  private getCAPBestPractices(): string {
    return `## SAP CAP Best Practices

1. **Data Modeling**: Use CDS for declarative data models with associations
2. **Service Layer**: Define OData V4 services with proper annotations
3. **Business Logic**: Implement in event handlers (before/after/on)
4. **Authorization**: Use @requires and @restrict annotations
5. **Fiori UI**: Use Fiori Elements with CDS annotations for rapid UI
6. **Deployment**: Package as MTA for SAP BTP deployment
7. **Testing**: Write unit tests for business logic, integration tests for services`;
  }
  /**
   * Analyze ABAP code using LLM (Fallback when MCP fails)
   */
  async analyzeABAPWithLLM(code: string): Promise<any> {
    console.log('[LLMService] Analyzing ABAP code with LLM (Fallback)...');

    const prompt = `
You are an expert SAP ABAP Analyzer. Analyze the following ABAP code and extract key information.

CODE:
${code.substring(0, 10000)} // Limit context

Return a JSON object with this EXACT structure:
{
  "businessLogic": ["string", "string"],
  "tables": ["string", "string"],
  "dependencies": ["string", "string"],
  "patterns": ["string", "string"],
  "complexity": number (1-10),
  "module": "string" (e.g. SD, MM, FI)
}
`;

    try {
      const response = await this.callOpenAI(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        businessLogic: result.businessLogic || [],
        tables: result.tables || [],
        dependencies: result.dependencies || [],
        patterns: result.patterns || [],
        complexity: result.complexity || 5,
        linesOfCode: code.split('\n').length,
        module: result.module || 'CUSTOM',
        capDocs: 0
      };
    } catch (error) {
      console.error('[LLMService] LLM analysis failed:', error);
      // Return basic fallback
      return {
        businessLogic: ['Analysis failed'],
        tables: [],
        dependencies: [],
        patterns: [],
        complexity: 1,
        linesOfCode: code.split('\n').length,
        module: 'UNKNOWN',
        capDocs: 0
      };
    }
  }
}

/**
 * Create LLM service instance from environment variables
 */
export function createLLMService(): LLMService {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new LLMService({
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000', 10)
  });
}
