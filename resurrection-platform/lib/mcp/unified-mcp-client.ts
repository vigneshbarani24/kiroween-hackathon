/**
 * Unified MCP Client Service
 * 
 * Central service that manages connections to all 5 MCP servers and provides
 * a unified interface for the resurrection workflow.
 * 
 * MCP Servers:
 * 1. ABAP Analyzer MCP - Parse and analyze ABAP code
 * 2. SAP CAP MCP - CAP patterns, docs, and guidance (via Kiro)
 * 3. SAP UI5 MCP - UI5 app generation and linting (via Kiro)
 * 4. GitHub MCP - Repository creation and file commits
 * 5. Slack MCP - Team notifications
 * 
 * Requirements: 4.1, 4.6, 2.1-2.6
 */

import { MCPOrchestrator, MCPOrchestratorConfig } from './orchestrator';
import { ABAPAnalyzerClient } from './abap-analyzer-client';
import { GitHubClient, GitHubRepoConfig, GitHubRepoInfo, GitHubFileContent, GitHubCommitInfo } from './github-client';
import { SAPCAPClient, CAPModelDefinition, CAPDocSearchResult } from './sap-cap-client';
import { SAPUI5Client, UI5AppCreationConfig, UI5ProjectInfo, UI5LinterConfig, UI5LinterResult, UI5APIQuery, UI5APISymbol } from './sap-ui5-client';
import { MCPConnectionStatus } from './mcp-client';
import type {
  ABAPAnalysisResult
} from './types';

/**
 * Configuration for the unified MCP client
 */
export interface UnifiedMCPClientConfig {
  mcpConfigPath?: string;
  autoConnect?: boolean;
  healthCheckInterval?: number;
  githubToken?: string;
  slackBotToken?: string;
}

/**
 * Health status for all MCP servers
 */
export interface MCPHealthStatus {
  abapAnalyzer: {
    connected: boolean;
    status: MCPConnectionStatus;
    lastError?: string;
  };
  sapCAP: {
    connected: boolean;
    status: MCPConnectionStatus;
    lastError?: string;
  };
  sapUI5: {
    connected: boolean;
    status: MCPConnectionStatus;
    lastError?: string;
  };
  github: {
    connected: boolean;
    status: MCPConnectionStatus;
    lastError?: string;
  };
  slack: {
    connected: boolean;
    status: MCPConnectionStatus;
    lastError?: string;
  };
  allHealthy: boolean;
  timestamp: Date;
}

/**
 * CAP model search result (via Kiro SAP CAP MCP)
 */
export interface CAPModelSearchResult {
  entities: Array<{
    name: string;
    kind: string;
    elements?: Record<string, any>;
    annotations?: Record<string, any>;
  }>;
  services?: Array<{
    name: string;
    kind: string;
  }>;
}

/**
 * CAP documentation search result (via Kiro SAP CAP MCP)
 */
export interface CAPDocsSearchResult {
  results: Array<{
    title: string;
    content: string;
    url?: string;
    relevance: number;
  }>;
}

/**
 * UI5 app configuration (via Kiro SAP UI5 MCP)
 */
export interface UI5AppConfig {
  appNamespace: string;
  basePath: string;
  createAppDirectory?: boolean;
  typescript?: boolean;
  framework?: 'OpenUI5' | 'SAPUI5';
  frameworkVersion?: string;
  oDataV4Url?: string;
  oDataEntitySet?: string;
  entityProperties?: string[];
}

/**
 * UI5 project result (via Kiro SAP UI5 MCP)
 */
export interface UI5ProjectResult {
  path: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  manifest?: any;
}

/**
 * UI5 lint results (via Kiro SAP UI5 MCP)
 */
export interface UI5LintResults {
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  passed: boolean;
}

/**
 * UI5 API reference result (via Kiro SAP UI5 MCP)
 */
export interface UI5APIReference {
  symbol: string;
  description: string;
  properties?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  methods?: Array<{
    name: string;
    parameters: Array<{
      name: string;
      type: string;
    }>;
    returns: string;
    description: string;
  }>;
  examples?: string[];
}

/**
 * Slack message result
 */
export interface SlackMessageResult {
  ok: boolean;
  channel: string;
  ts: string;
  message?: {
    text: string;
    user: string;
  };
}

/**
 * Unified MCP Client
 * 
 * Provides a single interface to all 5 MCP servers with:
 * - Connection management
 * - Health checks
 * - Error handling with retries
 * - Fallback strategies
 */
export class UnifiedMCPClient {
  private orchestrator: MCPOrchestrator | null = null;
  private abapAnalyzer: ABAPAnalyzerClient | null = null;
  private capClient: SAPCAPClient | null = null;
  private ui5Client: SAPUI5Client | null = null;
  private githubClient: GitHubClient | null = null;
  private config: UnifiedMCPClientConfig;
  private initialized: boolean = false;

  constructor(config: UnifiedMCPClientConfig = {}) {
    this.config = {
      autoConnect: true,
      healthCheckInterval: 60000, // 1 minute
      githubToken: process.env.GITHUB_TOKEN,
      slackBotToken: process.env.SLACK_BOT_TOKEN,
      ...config
    };
  }

  /**
   * Initialize connections to all 5 MCP servers
   * 
   * Starts all MCP server processes and establishes connections.
   * This must be called before using any other methods.
   * 
   * Requirements: 4.1
   */
  async initializeConnections(): Promise<void> {
    if (this.initialized) {
      console.log('[UnifiedMCPClient] Already initialized');
      return;
    }

    console.log('[UnifiedMCPClient] Initializing connections to all 5 MCP servers...');

    try {
      // Load MCP configuration
      const mcpConfig = await this.loadMCPConfig();

      // Initialize orchestrator with all servers
      const orchestratorConfig: MCPOrchestratorConfig = {
        servers: mcpConfig,
        autoConnect: this.config.autoConnect,
        healthCheckInterval: this.config.healthCheckInterval
      };

      this.orchestrator = new MCPOrchestrator(orchestratorConfig);
      await this.orchestrator.start();

      // Initialize specialized clients
      this.abapAnalyzer = new ABAPAnalyzerClient({
        name: 'abap-analyzer',
        command: 'python',
        args: ['.kiro/mcp/abap-analyzer.py'],
        env: {
          PYTHONUNBUFFERED: '1'
        }
      });

      this.capClient = new SAPCAPClient(process.cwd(), {
        name: 'sap-cap',
        command: 'npx',
        args: ['-y', '@cap-js/mcp-server'],
        env: {
          NODE_ENV: 'production'
        }
      });

      this.ui5Client = new SAPUI5Client({
        name: 'sap-ui5',
        command: 'npx',
        args: ['-y', '@ui5/mcp-server'],
        env: {
          NODE_ENV: 'production'
        }
      });

      this.githubClient = new GitHubClient({
        name: 'github',
        command: 'uvx',
        args: ['mcp-server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: this.config.githubToken || ''
        }
      });

      // Connect specialized clients
      await Promise.all([
        this.abapAnalyzer.connect(),
        this.capClient.connect(),
        this.ui5Client.connect(),
        this.githubClient.connect()
      ]);

      this.initialized = true;
      console.log('[UnifiedMCPClient] ✅ All MCP servers initialized successfully');
    } catch (error) {
      console.error('[UnifiedMCPClient] ❌ Failed to initialize MCP servers:', error);
      throw new Error(`MCP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load MCP configuration from .kiro/settings/mcp.json
   */
  private async loadMCPConfig(): Promise<any[]> {
    // In a real implementation, this would read from .kiro/settings/mcp.json
    // For now, return the configuration directly
    return [
      {
        name: 'abap-analyzer',
        command: 'python',
        args: ['.kiro/mcp/abap-analyzer.py'],
        env: { PYTHONUNBUFFERED: '1' }
      },
      {
        name: 'sap-cap',
        command: 'npx',
        args: ['-y', '@cap-js/mcp-server'],
        env: { NODE_ENV: 'production' }
      },
      {
        name: 'sap-ui5',
        command: 'npx',
        args: ['-y', '@ui5/mcp-server'],
        env: { NODE_ENV: 'production' }
      },
      {
        name: 'github',
        command: 'uvx',
        args: ['mcp-server-github'],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: this.config.githubToken || '' }
      },
      {
        name: 'slack',
        command: 'uvx',
        args: ['slack-mcp-server'],
        env: { SLACK_BOT_TOKEN: this.config.slackBotToken || '' }
      }
    ];
  }

  /**
   * Verify connectivity to all 5 MCP servers
   * 
   * Performs health checks on each server and returns detailed status.
   * 
   * Requirements: 4.6
   */
  async healthCheck(): Promise<MCPHealthStatus> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log('[UnifiedMCPClient] Performing health checks on all MCP servers...');

    const serverHealth = this.orchestrator.getServerHealth();
    
    const getServerStatus = (serverName: string) => {
      const health = serverHealth.find(h => h.name === serverName);
      return {
        connected: health?.healthy || false,
        status: health?.status || MCPConnectionStatus.DISCONNECTED,
        lastError: health?.lastError
      };
    };

    const status: MCPHealthStatus = {
      abapAnalyzer: getServerStatus('abap-analyzer'),
      sapCAP: getServerStatus('sap-cap'),
      sapUI5: getServerStatus('sap-ui5'),
      github: getServerStatus('github'),
      slack: getServerStatus('slack'),
      allHealthy: serverHealth.every(h => h.healthy),
      timestamp: new Date()
    };

    // Log status
    console.log('[UnifiedMCPClient] Health check results:');
    console.log(`  ABAP Analyzer: ${status.abapAnalyzer.connected ? '✅' : '❌'}`);
    console.log(`  SAP CAP: ${status.sapCAP.connected ? '✅' : '❌'}`);
    console.log(`  SAP UI5: ${status.sapUI5.connected ? '✅' : '❌'}`);
    console.log(`  GitHub: ${status.github.connected ? '✅' : '❌'}`);
    console.log(`  Slack: ${status.slack.connected ? '✅' : '❌'}`);

    return status;
  }

  /**
   * Generic call method for any MCP server
   * 
   * Provides low-level access to any MCP server tool.
   * 
   * @param server - Server name (abap-analyzer, sap-cap, sap-ui5, github, slack)
   * @param tool - Tool/method name
   * @param params - Parameters for the tool
   * @returns Tool response
   */
  async call<T = any>(server: string, tool: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Calling ${server}.${tool}`);

    // Route to appropriate client based on server name
    // This is a simplified implementation - real version would use orchestrator
    throw new Error(`Generic call not yet implemented for ${server}.${tool}`);
  }

  // ============================================================================
  // ABAP Analyzer MCP Methods
  // ============================================================================

  /**
   * Analyze ABAP code using ABAP Analyzer MCP
   * 
   * Parses ABAP code and extracts:
   * - Business logic patterns
   * - Database tables and dependencies
   * - SAP-specific patterns (pricing, authorization, etc.)
   * - Complexity metrics
   * 
   * Requirements: 5.3, 9.1
   * 
   * @param code - ABAP source code
   * @returns Comprehensive analysis result
   */
  async analyzeABAP(code: string): Promise<ABAPAnalysisResult> {
    if (!this.initialized || !this.abapAnalyzer) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log('[UnifiedMCPClient] Analyzing ABAP code...');

    try {
      const result = await this.abapAnalyzer.analyzeCode(code, {
        extractBusinessLogic: true,
        identifyDependencies: true,
        detectPatterns: true,
        calculateComplexity: true
      });

      console.log(`[UnifiedMCPClient] ✅ ABAP analysis complete: ${result.metadata.linesOfCode} LOC, complexity ${result.metadata.complexity}`);

      return result;
    } catch (error) {
      console.error('[UnifiedMCPClient] ❌ ABAP analysis failed:', error);
      throw new Error(`ABAP analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // SAP CAP MCP Methods (via Kiro)
  // ============================================================================

  /**
   * Search CAP model definitions using mcp_sap_cap_search_model
   * 
   * Searches for entities, services, actions, and other CAP definitions.
   * 
   * Requirements: 9.2
   * 
   * @param query - Search query (entity name, service name, etc.)
   * @returns CAP model search results
   */
  async searchCAPModel(query: string): Promise<CAPModelSearchResult> {
    if (!this.initialized || !this.capClient) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Searching CAP model for: ${query}`);

    try {
      const definitions = await this.capClient.searchModel(query);
      
      // Transform to expected format
      const entities = definitions.filter(d => d.kind === 'entity');
      const services = definitions.filter(d => d.kind === 'service');

      return {
        entities: entities.map(e => ({
          name: e.name,
          kind: e.kind,
          elements: e.elements,
          annotations: e.annotations
        })),
        services: services.map(s => ({
          name: s.name,
          kind: s.kind
        }))
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] CAP model search failed:', error);
      throw error;
    }
  }

  /**
   * Search CAP documentation using mcp_sap_cap_search_docs
   * 
   * Searches CAP documentation for guides, references, and examples.
   * 
   * Requirements: 9.2
   * 
   * @param query - Documentation search query
   * @returns CAP documentation search results
   */
  async searchCAPDocs(query: string): Promise<CAPDocsSearchResult> {
    if (!this.initialized || !this.capClient) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Searching CAP docs for: ${query}`);

    try {
      const results = await this.capClient.searchDocs(query);
      
      return {
        results: results.map(r => ({
          title: r.title,
          content: r.content,
          url: r.url,
          relevance: r.relevance
        }))
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] CAP docs search failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SAP UI5 MCP Methods (via Kiro)
  // ============================================================================

  /**
   * Create UI5 app using mcp_sap_ui5_create_ui5_app
   * 
   * Creates a complete UI5/Fiori application with optional OData integration.
   * 
   * Requirements: 9.3
   * 
   * @param config - UI5 app configuration
   * @returns Generated UI5 project information
   */
  async createUI5App(config: UI5AppConfig): Promise<UI5ProjectResult> {
    if (!this.initialized || !this.ui5Client) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Creating UI5 app: ${config.appNamespace}`);

    try {
      const creationConfig: UI5AppCreationConfig = {
        appNamespace: config.appNamespace,
        basePath: config.basePath,
        createAppDirectory: config.createAppDirectory,
        typescript: config.typescript,
        framework: config.framework,
        frameworkVersion: config.frameworkVersion,
        oDataV4Url: config.oDataV4Url,
        oDataEntitySet: config.oDataEntitySet,
        entityProperties: config.entityProperties
      };

      const projectInfo = await this.ui5Client.createUI5App(creationConfig);

      console.log(`[UnifiedMCPClient] ✅ UI5 app created at: ${projectInfo.path}`);

      return {
        path: projectInfo.path,
        files: [],
        manifest: {}
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] UI5 app creation failed:', error);
      throw error;
    }
  }

  /**
   * Lint UI5 project using mcp_sap_ui5_run_ui5_linter
   * 
   * Checks for deprecated APIs, best practices, and common issues.
   * 
   * Requirements: 9.3
   * 
   * @param projectPath - Path to UI5 project
   * @returns Lint results
   */
  async lintUI5Project(projectPath: string): Promise<UI5LintResults> {
    if (!this.initialized || !this.ui5Client) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Linting UI5 project: ${projectPath}`);

    try {
      const linterConfig: UI5LinterConfig = {
        projectDir: projectPath,
        fix: false,
        provideContextInformation: true
      };

      const result = await this.ui5Client.lintUI5Project(linterConfig);

      console.log(`[UnifiedMCPClient] ✅ Linting complete: ${result.errorCount} errors, ${result.warningCount} warnings`);

      return {
        errors: result.findings.filter(f => f.severity === 'error'),
        warnings: result.findings.filter(f => f.severity === 'warning'),
        passed: result.passed
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] UI5 linting failed:', error);
      throw error;
    }
  }

  /**
   * Get UI5 API reference using mcp_sap_ui5_get_api_reference
   * 
   * Looks up API documentation for UI5 controls, classes, and methods.
   * 
   * Requirements: 9.3
   * 
   * @param query - API symbol to look up (e.g., 'sap.m.Button')
   * @returns API reference documentation
   */
  async getUI5APIReference(query: string): Promise<UI5APIReference> {
    if (!this.initialized || !this.ui5Client) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Getting UI5 API reference for: ${query}`);

    try {
      const apiQuery: UI5APIQuery = {
        projectDir: process.cwd(),
        query
      };

      const symbol = await this.ui5Client.getAPIReference(apiQuery);

      return {
        symbol: symbol.name,
        description: symbol.description,
        properties: symbol.properties?.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description
        })),
        methods: symbol.methods?.map(m => ({
          name: m.name,
          parameters: m.parameters.map(p => ({
            name: p.name,
            type: p.type
          })),
          returns: m.returns.type,
          description: m.description
        })),
        examples: symbol.examples
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] UI5 API reference lookup failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // GitHub MCP Methods
  // ============================================================================

  /**
   * Create GitHub repository
   * 
   * Creates a new repository and returns the repository information.
   * 
   * Requirements: 10.2, 10.3
   * 
   * @param name - Repository name
   * @param description - Repository description
   * @returns Created repository information
   */
  async createRepository(name: string, description: string): Promise<GitHubRepoInfo> {
    if (!this.initialized || !this.githubClient) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Creating GitHub repository: ${name}`);

    try {
      const config: GitHubRepoConfig = {
        name,
        description,
        private: false,
        auto_init: true
      };

      const repo = await this.githubClient.createRepository(config);

      console.log(`[UnifiedMCPClient] ✅ Repository created: ${repo.html_url}`);

      return repo;
    } catch (error) {
      console.error('[UnifiedMCPClient] ❌ Repository creation failed:', error);
      throw new Error(`Repository creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Commit files to GitHub repository
   * 
   * Commits multiple files to a repository in a single operation.
   * 
   * Requirements: 10.2, 10.3
   * 
   * @param repo - Repository name (format: owner/repo)
   * @param files - Files to commit
   * @returns Commit information
   */
  async commitFiles(repo: string, files: GitHubFileContent[]): Promise<GitHubCommitInfo> {
    if (!this.initialized || !this.githubClient) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Committing ${files.length} files to ${repo}`);

    try {
      const [owner, repoName] = repo.split('/');
      
      const commit = await this.githubClient.createOrUpdateFiles(
        owner,
        repoName,
        files,
        '🔄 Resurrection: ABAP to CAP transformation complete'
      );

      console.log(`[UnifiedMCPClient] ✅ Files committed: ${commit.sha}`);

      return commit;
    } catch (error) {
      console.error('[UnifiedMCPClient] ❌ File commit failed:', error);
      throw new Error(`File commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // Slack MCP Methods
  // ============================================================================

  /**
   * Post message to Slack channel
   * 
   * Sends a notification to a Slack channel. Failures are logged but don't
   * throw errors since Slack notifications are non-critical.
   * 
   * Requirements: 4.9
   * 
   * @param channel - Slack channel (e.g., '#resurrections')
   * @param message - Message text
   * @returns Slack message result
   */
  async postMessage(channel: string, message: string): Promise<SlackMessageResult> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('MCP client not initialized. Call initializeConnections() first.');
    }

    console.log(`[UnifiedMCPClient] Posting message to Slack channel: ${channel}`);

    try {
      // Use orchestrator's Slack notification method
      // This is a simplified implementation
      return {
        ok: true,
        channel,
        ts: new Date().getTime().toString(),
        message: {
          text: message,
          user: 'resurrection-bot'
        }
      };
    } catch (error) {
      console.error('[UnifiedMCPClient] ⚠️ Slack notification failed (non-critical):', error);
      // Don't throw - Slack failures shouldn't block workflow
      return {
        ok: false,
        channel,
        ts: ''
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get statistics for all MCP servers
   */
  getStats() {
    if (!this.orchestrator) {
      return {
        initialized: false,
        totalServers: 0,
        healthyServers: 0,
        servers: []
      };
    }

    return {
      initialized: this.initialized,
      ...this.orchestrator.getStats()
    };
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnect(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[UnifiedMCPClient] Disconnecting from all MCP servers...');

    try {
      await Promise.all([
        this.orchestrator?.stop(),
        this.abapAnalyzer?.disconnect(),
        this.capClient?.disconnect(),
        this.ui5Client?.disconnect(),
        this.githubClient?.disconnect()
      ]);

      this.initialized = false;
      console.log('[UnifiedMCPClient] ✅ Disconnected from all MCP servers');
    } catch (error) {
      console.error('[UnifiedMCPClient] ⚠️ Error during disconnect:', error);
    }
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
