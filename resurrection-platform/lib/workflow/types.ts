/**
 * Workflow Type Definitions
 * 
 * Types for resurrection workflow engine
 */

import { TransformationPlan } from '../generators/types';

// Resurrection Status
export type ResurrectionStatus = 
  | 'analyzing' 
  | 'planning' 
  | 'generating' 
  | 'validating' 
  | 'deploying' 
  | 'completed' 
  | 'failed';

// Resurrection Configuration
export interface ResurrectionConfig {
  name: string;
  module?: 'SD' | 'MM' | 'FI' | 'CO' | 'HR' | 'PP' | 'CUSTOM';
  skipGitHub?: boolean;
  skipSlack?: boolean;
  githubPrivate?: boolean;
  slackChannel?: string;
}

// Resurrection Metadata
export interface Resurrection {
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
  module: 'SD' | 'MM' | 'FI' | 'CO' | 'HR' | 'PP' | 'CUSTOM';
  complexity: number;
  linesOfCode: number;
  error?: string;
}

// ABAP Analysis Result
export interface ABAPAnalysis {
  businessLogic: string[];
  tables: string[];
  dependencies: string[];
  patterns: string[];
  metadata: {
    module: string;
    complexity: number;
    linesOfCode: number;
    programName?: string;
    programType?: string;
  };
  documentation: string;
}

// Workflow Step
export interface WorkflowStep {
  id: string;
  resurrectionId: string;
  stepNumber: number;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
}

// Workflow Events
export type WorkflowEvent = 
  | { type: 'step_start'; step: string; stepNumber: number }
  | { type: 'step_complete'; step: string; stepNumber: number; output: any }
  | { type: 'step_error'; step: string; stepNumber: number; error: string }
  | { type: 'workflow_complete'; result: WorkflowResult }
  | { type: 'workflow_error'; error: string };

// Workflow Result
export interface WorkflowResult {
  analysis: ABAPAnalysis;
  plan: TransformationPlan;
  project: GeneratedProject;
  validation: ValidationResult;
  deployment: DeploymentResult;
}

// Generated Project
export interface GeneratedProject {
  name: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  structure: {
    db: string[];
    srv: string[];
    app: string[];
    root: string[];
  };
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  file: string;
  line?: number;
  message: string;
  severity: 'warning';
}

// Deployment Result
export interface DeploymentResult {
  githubRepoUrl?: string;
  slackNotificationSent: boolean;
  deployedAt: Date;
}

// MCP Log Entry
export interface MCPLogEntry {
  id: string;
  resurrectionId: string;
  serverName: string;
  toolName: string;
  params: any;
  response?: any;
  error?: string;
  durationMs: number;
  calledAt: Date;
}
