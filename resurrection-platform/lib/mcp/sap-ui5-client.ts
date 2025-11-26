/**
 * SAP UI5 MCP Client
 * 
 * Specialized client for SAP UI5/Fiori development using the SAP UI5 MCP server.
 * 
 * IMPORTANT: This MCP server is accessed via Kiro AI, not directly.
 * The methods in this class document the available Kiro MCP tools:
 * - mcp_sap_ui5_create_ui5_app
 * - mcp_sap_ui5_run_ui5_linter
 * - mcp_sap_ui5_get_api_reference
 * - mcp_sap_ui5_get_project_info
 * 
 * Requirements: 9.3
 */

import { MCPClient, MCPServerConfig } from './mcp-client';

/**
 * UI5 app creation configuration
 */
export interface UI5AppCreationConfig {
  appNamespace: string; // e.g., "com.myorg.myapp"
  basePath: string; // Absolute path where app will be created
  createAppDirectory?: boolean; // Create subdirectory with app namespace
  author?: string;
  typescript?: boolean; // TypeScript (true) or JavaScript (false)
  framework?: 'OpenUI5' | 'SAPUI5';
  frameworkVersion?: string; // e.g., "1.136.0"
  initializeGitRepository?: boolean;
  runNpmInstall?: boolean;
  oDataV4Url?: string; // OData service URL
  oDataEntitySet?: string; // Entity set to display
  entityProperties?: string[]; // Properties to show in UI
}

/**
 * UI5 project information
 */
export interface UI5ProjectInfo {
  path: string;
  namespace: string;
  framework: 'OpenUI5' | 'SAPUI5';
  frameworkVersion: string;
  typescript: boolean;
  hasManifest: boolean;
  hasPackageJson: boolean;
  oDataServices?: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * UI5 linter configuration
 */
export interface UI5LinterConfig {
  projectDir: string; // Absolute path to UI5 project
  filePatterns?: string[]; // Specific files to lint
  fix?: boolean; // Auto-fix issues
  provideContextInformation?: boolean; // Include API reference in output
}

/**
 * UI5 linter finding
 */
export interface UI5LinterFinding {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  ruleId: string;
  fixable?: boolean;
}

/**
 * UI5 linter result
 */
export interface UI5LinterResult {
  findings: UI5LinterFinding[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passed: boolean; // True if no errors
  contextInformation?: {
    apiReference?: string;
    documentation?: string;
  };
}

/**
 * UI5 API reference query
 */
export interface UI5APIQuery {
  projectDir: string; // For version detection
  query: string; // Symbol name (e.g., "sap.m.Button", "sap/ui/core/Core")
}

/**
 * UI5 API symbol information
 */
export interface UI5APISymbol {
  name: string;
  kind: 'class' | 'namespace' | 'interface' | 'enum' | 'function';
  description: string;
  deprecated?: boolean;
  since?: string;
  module: string;
  extends?: string;
  implements?: string[];
  properties?: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: any;
    deprecated?: boolean;
  }>;
  methods?: Array<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      optional?: boolean;
      description?: string;
    }>;
    returns: {
      type: string;
      description?: string;
    };
    deprecated?: boolean;
  }>;
  events?: Array<{
    name: string;
    description: string;
    parameters?: Record<string, string>;
  }>;
  examples?: string[];
}

/**
 * SAP UI5 MCP Client
 * 
 * Note: This client documents the Kiro MCP tools for SAP UI5.
 * In production, these methods would be called via Kiro AI, not directly.
 */
export class SAPUI5Client {
  private client: MCPClient;

  constructor(config?: Partial<MCPServerConfig>) {
    const defaultConfig: MCPServerConfig = {
      name: 'sap-ui5',
      command: 'npx',
      args: ['-y', '@ui5/mcp-server'],
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      timeout: 120000, // 2 minutes for app creation
      maxRetries: 3,
      ...config
    };

    this.client = new MCPClient(defaultConfig);
  }

  /**
   * Connect to SAP UI5 MCP server
   */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Disconnect from SAP UI5 MCP server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Create a new UI5 application
   * 
   * Uses mcp_sap_ui5_create_ui5_app to generate a complete UI5/Fiori app.
   * 
   * The generated app includes:
   * - Basic UI5 application structure
   * - manifest.json with app configuration
   * - View and controller files
   * - OData model configuration (if oDataV4Url provided)
   * - Initial UI with entity display (if oDataEntitySet provided)
   * 
   * @param config - App creation configuration
   * @returns Created app information
   */
  async createUI5App(config: UI5AppCreationConfig): Promise<UI5ProjectInfo> {
    const response = await this.client.call<UI5ProjectInfo>(
      'mcp_sap_ui5_create_ui5_app',
      {
        appNamespace: config.appNamespace,
        basePath: config.basePath,
        createAppDirectory: config.createAppDirectory ?? true,
        author: config.author,
        typescript: config.typescript ?? true,
        framework: config.framework ?? 'SAPUI5',
        frameworkVersion: config.frameworkVersion,
        initializeGitRepository: config.initializeGitRepository ?? true,
        runNpmInstall: config.runNpmInstall ?? true,
        oDataV4Url: config.oDataV4Url,
        oDataEntitySet: config.oDataEntitySet,
        entityProperties: config.entityProperties
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `UI5 app creation failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Run UI5 linter on a project
   * 
   * Uses mcp_sap_ui5_run_ui5_linter to check for:
   * - Deprecated API usage
   * - Best practice violations
   * - Common mistakes
   * - Performance issues
   * 
   * @param config - Linter configuration
   * @returns Linter results with findings
   */
  async lintUI5Project(config: UI5LinterConfig): Promise<UI5LinterResult> {
    const response = await this.client.call<UI5LinterResult>(
      'mcp_sap_ui5_run_ui5_linter',
      {
        projectDir: config.projectDir,
        filePatterns: config.filePatterns,
        fix: config.fix ?? false,
        provideContextInformation: config.provideContextInformation ?? true
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `UI5 linting failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get UI5 API reference for a symbol
   * 
   * Uses mcp_sap_ui5_get_api_reference to look up API documentation.
   * 
   * Supports both dot and slash notation:
   * - "sap.m.Button"
   * - "sap/m/Button"
   * - "sap.ui.core.Core#init" (specific method)
   * 
   * @param query - API query
   * @returns API symbol information
   */
  async getAPIReference(query: UI5APIQuery): Promise<UI5APISymbol> {
    const response = await this.client.call<UI5APISymbol>(
      'mcp_sap_ui5_get_api_reference',
      {
        projectDir: query.projectDir,
        query: query.query
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `UI5 API reference lookup failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Get UI5 project information
   * 
   * Uses mcp_sap_ui5_get_project_info to analyze a UI5 project.
   * 
   * @param projectDir - Absolute path to UI5 project
   * @returns Project information
   */
  async getProjectInfo(projectDir: string): Promise<UI5ProjectInfo> {
    const response = await this.client.call<UI5ProjectInfo>(
      'mcp_sap_ui5_get_project_info',
      {
        projectDir
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `Get UI5 project info failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data;
  }

  /**
   * Validate UI5 project structure
   * 
   * Checks if a directory contains a valid UI5 project.
   * 
   * @param projectDir - Path to check
   * @returns True if valid UI5 project
   */
  async validateProjectStructure(projectDir: string): Promise<boolean> {
    try {
      const info = await this.getProjectInfo(projectDir);
      return info.hasManifest && info.hasPackageJson;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get UI5 control documentation
   * 
   * Convenience method to look up a specific UI5 control.
   * 
   * @param projectDir - Project directory for version detection
   * @param controlName - Control name (e.g., "sap.m.Button")
   * @returns Control API documentation
   */
  async getControlDocs(projectDir: string, controlName: string): Promise<UI5APISymbol> {
    return this.getAPIReference({
      projectDir,
      query: controlName
    });
  }

  /**
   * Search for UI5 controls by category
   * 
   * @param projectDir - Project directory
   * @param category - Control category (e.g., "sap.m", "sap.ui.table")
   * @returns Array of controls in that category
   */
  async searchControlsByCategory(
    projectDir: string,
    category: string
  ): Promise<UI5APISymbol[]> {
    // This would need to be implemented by calling getAPIReference
    // multiple times or by adding a search capability to the MCP server
    throw new Error('Not yet implemented');
  }

  /**
   * Get client status and statistics
   */
  getStats() {
    return this.client.getStats();
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}

/**
 * Helper function to create a UI5 client
 * 
 * @returns Configured SAP UI5 client
 */
export function createUI5Client(): SAPUI5Client {
  return new SAPUI5Client();
}
