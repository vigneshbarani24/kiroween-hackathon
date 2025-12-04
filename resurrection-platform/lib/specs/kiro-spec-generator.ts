/**
 * Kiro Spec Generator
 * 
 * Generates Kiro spec documents (requirements.md, design.md, tasks.md) from ABAP analysis
 * for complex resurrection projects.
 */

import { LLMService } from '../llm/llm-service';

export interface ABAPAnalysis {
  objects: Array<{
    name: string;
    type: string;
    module: string;
    linesOfCode: number;
    complexity: number;
    businessLogic?: string;
    dependencies?: string[];
    tables?: string[];
  }>;
  totalLOC: number;
  module: string;
  patterns?: string[];
}

export interface SpecGenerationResult {
  requirements: string;
  design: string;
  tasks: string;
}

export class KiroSpecGenerator {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      temperature: 0.3,
      maxTokens: 4000
    });
  }

  /**
   * Generate complete Kiro spec from ABAP analysis
   */
  async generateSpec(
    projectName: string,
    analysis: ABAPAnalysis
  ): Promise<SpecGenerationResult> {
    const requirements = await this.generateRequirements(projectName, analysis);
    const design = await this.generateDesign(projectName, analysis, requirements);
    const tasks = await this.generateTasks(projectName, analysis, requirements, design);

    return {
      requirements,
      design,
      tasks,
    };
  }

  /**
   * Generate requirements.md with EARS-formatted acceptance criteria
   */
  async generateRequirements(
    projectName: string,
    analysis: ABAPAnalysis
  ): Promise<string> {
    const prompt = `You are an expert SAP architect creating a requirements document for a resurrection project.

Project: ${projectName}
Module: ${analysis.module}
Total LOC: ${analysis.totalLOC}

ABAP Objects:
${analysis.objects.map(obj => `- ${obj.name} (${obj.type}): ${obj.linesOfCode} LOC, Complexity: ${obj.complexity}`).join('\n')}

${analysis.patterns ? `Detected Patterns:\n${analysis.patterns.join('\n')}` : ''}

Generate a requirements document following this structure:

# Requirements Document: ${projectName}

## Introduction
[Brief description of the resurrection project and its purpose]

## Glossary
- **System Name**: The resurrection CAP application
- **Original ABAP**: Legacy ABAP code being transformed
[Add other relevant terms]

## Requirements

### Requirement 1: [Core Functionality]
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN the System SHALL [response]
2. WHILE [state] THEN the System SHALL [response]
3. IF [condition] THEN the System SHALL [response]

[Continue with 3-5 requirements based on the ABAP analysis]

IMPORTANT:
- Use EARS patterns (WHEN/WHILE/IF/WHERE/THE System SHALL)
- Focus on business functionality from the ABAP code
- Include data model requirements
- Include API/service requirements
- Include UI requirements
- Include quality/testing requirements
- Each requirement should have 3-5 acceptance criteria
- Be specific and testable

Generate the complete requirements document now:`;

    const response = await this.llmService.callOpenAI(prompt);

    return response;
  }

  /**
   * Generate design.md with architecture and correctness properties
   */
  async generateDesign(
    projectName: string,
    analysis: ABAPAnalysis,
    requirements: string
  ): Promise<string> {
    const prompt = `You are an expert SAP architect creating a design document for a resurrection project.

Project: ${projectName}
Module: ${analysis.module}

Requirements Document:
${requirements}

ABAP Analysis:
${JSON.stringify(analysis, null, 2)}

Generate a design document following this structure:

# Design Document: ${projectName}

## Overview
[High-level architecture description]

## Architecture
[System architecture with components]

## Components and Interfaces

### Backend (SAP CAP)
- CDS Models
- Service Definitions
- Business Logic Handlers

### Frontend (SAP Fiori)
- UI Components
- Annotations
- Navigation

### Integration
- APIs
- Events
- External Systems

## Data Models

### Entities
[List CDS entities based on ABAP tables]

### Associations
[Define relationships]

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: [Name]
*For any* [input], [expected behavior]
**Validates: Requirements X.Y**

[Generate 5-10 properties based on requirements]

## Error Handling
[Error handling strategy]

## Testing Strategy

### Unit Tests
[Unit testing approach]

### Property-Based Tests
[PBT approach using fast-check]

### Integration Tests
[Integration testing approach]

IMPORTANT:
- Base design on the requirements
- Include specific CDS model designs
- Define correctness properties that can be tested
- Reference specific requirements for each property
- Include SAP-specific patterns (pricing, authorization, etc.)

Generate the complete design document now:`;

    const response = await this.llmService.callOpenAI(prompt);

    return response;
  }

  /**
   * Generate tasks.md with MCP references and implementation checklist
   */
  async generateTasks(
    projectName: string,
    analysis: ABAPAnalysis,
    requirements: string,
    design: string
  ): Promise<string> {
    const prompt = `You are an expert SAP architect creating an implementation task list for a resurrection project.

Project: ${projectName}
Module: ${analysis.module}

Requirements:
${requirements.substring(0, 1000)}...

Design:
${design.substring(0, 1000)}...

Generate a tasks.md document following this structure:

# Implementation Plan: ${projectName}

## Overview
[Brief description of implementation approach]

## Tasks

- [ ] 1. Set up project structure
  - Create CAP project structure
  - Configure package.json with dependencies
  - Set up database connection
  - _Requirements: X.Y_

- [ ] 2. Implement data models
  - [ ] 2.1 Create CDS entities
    - Define entities based on ABAP tables
    - Add associations
    - _Requirements: X.Y_
  
  - [ ]* 2.2 Write property test for data models
    - **Property 1: [Name]**
    - **Validates: Requirements X.Y**

- [ ] 3. Implement business logic
  - [ ] 3.1 Create service definitions
    - Use ABAP Analyzer MCP to extract business rules
    - _Requirements: X.Y_
  
  - [ ] 3.2 Implement service handlers
    - Use SAP CAP Generator MCP
    - _Requirements: X.Y_

- [ ] 4. Generate UI
  - [ ] 4.1 Create Fiori Elements app
    - Use SAP UI5 Generator MCP
    - _Requirements: X.Y_

- [ ] 5. Quality validation
  - [ ] 5.1 Run quality checks
    - Validate CDS syntax
    - Check Clean Core compliance
    - _Requirements: X.Y_

- [ ] 6. Deploy to GitHub
  - [ ] 6.1 Create GitHub repository
    - Use GitHub MCP
    - _Requirements: X.Y_

IMPORTANT:
- Break down into discrete, actionable tasks
- Reference specific MCP servers where applicable
- Mark optional tasks with * (tests, documentation)
- Reference specific requirements for each task
- Include property-based test tasks for correctness properties
- Each property test should reference the design document property

Generate the complete tasks document now:`;

    const response = await this.llmService.callOpenAI(prompt);

    return response;
  }

  /**
   * Save spec files to the resurrection's spec directory
   */
  async saveSpecFiles(
    resurrectionId: string,
    projectName: string,
    spec: SpecGenerationResult
  ): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const specDir = path.join(process.cwd(), '.kiro', 'specs', `resurrection-${projectName}`);
    
    // Create directory
    await fs.mkdir(specDir, { recursive: true });

    // Write files
    await fs.writeFile(path.join(specDir, 'requirements.md'), spec.requirements, 'utf-8');
    await fs.writeFile(path.join(specDir, 'design.md'), spec.design, 'utf-8');
    await fs.writeFile(path.join(specDir, 'tasks.md'), spec.tasks, 'utf-8');

    // Create README
    const readme = `# Resurrection Spec: ${projectName}

This spec was automatically generated from ABAP analysis for resurrection project: ${resurrectionId}

## Files

- **requirements.md**: EARS-formatted requirements with acceptance criteria
- **design.md**: Architecture, data models, and correctness properties
- **tasks.md**: Implementation checklist with MCP references

## Usage

1. Review and refine the requirements
2. Validate the design approach
3. Execute tasks in order
4. Track progress using task checkboxes

Generated: ${new Date().toISOString()}
`;

    await fs.writeFile(path.join(specDir, 'README.md'), readme, 'utf-8');
  }
}
