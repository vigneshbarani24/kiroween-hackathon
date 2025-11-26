/**
 * Generator Type Definitions
 * 
 * Types for code generation components
 */

// CDS Entity Definition
export interface CDSEntity {
  name: string;
  fields: CDSField[];
  associations: CDSAssociation[];
  annotations: Record<string, any>;
}

export interface CDSField {
  name: string;
  type: string;
  key?: boolean;
  notNull?: boolean;
  default?: any;
  annotations?: Record<string, any>;
}

export interface CDSAssociation {
  name: string;
  target: string;
  cardinality: 'one' | 'many';
  on?: string;
}

// CDS Service Definition
export interface CDSService {
  name: string;
  entities: string[];
  actions?: CDSAction[];
  functions?: CDSFunction[];
  annotations?: Record<string, any>;
}

export interface CDSAction {
  name: string;
  params: CDSParameter[];
  returns?: string;
}

export interface CDSFunction {
  name: string;
  params: CDSParameter[];
  returns: string;
}

export interface CDSParameter {
  name: string;
  type: string;
}

// Mock Data Configuration
export interface MockDataConfig {
  entities: string[];
  recordsPerEntity: number;
  seed?: number;
  preserveReferentialIntegrity: boolean;
}

export interface MockDataRecord {
  [key: string]: any;
}

export interface CSVFiles {
  [entityName: string]: string;
}

// UI Configuration
export interface UIConfig {
  type: 'Fiori Elements' | 'Freestyle UI5';
  template?: string;
  namespace: string;
  entities: string[];
}

// Transformation Plan
export interface TransformationPlan {
  entities: CDSEntity[];
  services: CDSService[];
  ui: UIConfig;
  mockData: MockDataConfig;
}

// CAP Project Structure
export interface CAPProject {
  name: string;
  files: ProjectFile[];
  structure: ProjectStructure;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectStructure {
  db: string[];
  srv: string[];
  app: string[];
  root: string[];
}
