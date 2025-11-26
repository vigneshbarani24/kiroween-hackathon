/**
 * SAP CAP MCP Client
 * 
 * Specialized client for SAP CAP development using the SAP CAP MCP server.
 * 
 * IMPORTANT: This MCP server is accessed via Kiro AI, not directly.
 * The methods in this class document the available Kiro MCP tools:
 * - mcp_sap_cap_search_model
 * - mcp_sap_cap_search_docs
 * 
 * Requirements: 9.2
 */

import { MCPClient, MCPServerConfig } from './mcp-client';

/**
 * CAP model search options
 */
export interface CAPModelSearchOptions {
  kind?: string; // Filter by kind (entity, service, action, etc.)
  namesOnly?: boolean; // Return only names for overview
  topN?: number; // Maximum number of results
}

/**
 * CAP model definition (CSN format)
 */
export interface CAPModelDefinition {
  name: string;
  kind: string; // entity, service, action, function, type, etc.
  elements?: Record<string, CAPElement>;
  params?: Record<string, CAPParameter>;
  annotations?: Record<string, any>;
  location?: {
    file: string;
    line: number;
  };
  endpoints?: string[]; // HTTP endpoints for services
}

/**
 * CAP element (field in entity)
 */
export interface CAPElement {
  type: string;
  key?: boolean;
  notNull?: boolean;
  default?: any;
  length?: number;
  precision?: number;
  scale?: number;
  annotations?: Record<string, any>;
}

/**
 * CAP parameter (for actions/functions)
 */
export interface CAPParameter {
  type: string;
  optional?: boolean;
  default?: any;
}

/**
 * CAP documentation search result
 */
export interface CAPDocSearchResult {
  title: string;
  content: string;
  url?: string;
  relevance: number;
  category?: string; // 'guide' | 'reference' | 'example' | 'best-practice'
}

/**
 * SAP CAP MCP Client
 * 
 * Note: This client documents the Kiro MCP tools for SAP CAP.
 * In production, these methods would be called via Kiro AI, not directly.
 */
export class SAPCAPClient {
  private client: MCPClient;
  private projectPath: string;

  constructor(projectPath: string, config?: Partial<MCPServerConfig>) {
    this.projectPath = projectPath;

    const defaultConfig: MCPServerConfig = {
      name: 'sap-cap',
      command: 'npx',
      args: ['-y', '@cap-js/mcp-server'],
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      timeout: 30000,
      maxRetries: 3,
      ...config
    };

    this.client = new MCPClient(defaultConfig);
  }

  /**
   * Connect to SAP CAP MCP server
   */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Disconnect from SAP CAP MCP server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Search CAP model definitions
   * 
   * Uses mcp_sap_cap_search_model to find entities, services, actions, etc.
   * 
   * Example queries:
   * - "SalesOrder" - Find SalesOrder entity
   * - "service" - Find all services
   * - "CatalogService" - Find specific service
   * 
   * @param query - Search query (entity name, service name, etc.)
   * @param options - Search options
   * @returns Array of matching CAP definitions
   */
  async searchModel(
    query: string,
    options: CAPModelSearchOptions = {}
  ): Promise<CAPModelDefinition[]> {
    const response = await this.client.call<{ definitions: CAPModelDefinition[] }>(
      'mcp_sap_cap_search_model',
      {
        projectPath: this.projectPath,
        name: query,
        kind: options.kind,
        namesOnly: options.namesOnly || false,
        topN: options.topN || 10
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `CAP model search failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data.definitions;
  }

  /**
   * Search CAP documentation
   * 
   * Uses mcp_sap_cap_search_docs to find relevant documentation.
   * 
   * Example queries:
   * - "entity definition" - How to define entities
   * - "service handler" - How to implement service handlers
   * - "associations" - How to use associations
   * - "annotations" - Available annotations
   * 
   * @param query - Documentation search query
   * @param maxResults - Maximum number of results (default: 10)
   * @returns Array of documentation results
   */
  async searchDocs(
    query: string,
    maxResults: number = 10
  ): Promise<CAPDocSearchResult[]> {
    const response = await this.client.call<{ results: CAPDocSearchResult[] }>(
      'mcp_sap_cap_search_docs',
      {
        query,
        maxResults
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `CAP docs search failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data.results;
  }

  /**
   * Find entity definition by name
   * 
   * Convenience method to find a specific entity.
   * 
   * @param entityName - Entity name
   * @returns Entity definition or null if not found
   */
  async findEntity(entityName: string): Promise<CAPModelDefinition | null> {
    const results = await this.searchModel(entityName, {
      kind: 'entity',
      topN: 1
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find service definition by name
   * 
   * Convenience method to find a specific service.
   * 
   * @param serviceName - Service name
   * @returns Service definition or null if not found
   */
  async findService(serviceName: string): Promise<CAPModelDefinition | null> {
    const results = await this.searchModel(serviceName, {
      kind: 'service',
      topN: 1
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all entities in the project
   * 
   * @returns Array of all entity definitions
   */
  async getAllEntities(): Promise<CAPModelDefinition[]> {
    return this.searchModel('', {
      kind: 'entity',
      topN: 100
    });
  }

  /**
   * Get all services in the project
   * 
   * @returns Array of all service definitions
   */
  async getAllServices(): Promise<CAPModelDefinition[]> {
    return this.searchModel('', {
      kind: 'service',
      topN: 100
    });
  }

  /**
   * Search for CAP patterns
   * 
   * Finds documentation about common CAP patterns.
   * 
   * @param patternType - Type of pattern (e.g., 'managed', 'draft', 'temporal')
   * @returns Documentation about the pattern
   */
  async searchPattern(patternType: string): Promise<CAPDocSearchResult[]> {
    return this.searchDocs(`${patternType} pattern`, 5);
  }

  /**
   * Search for CAP best practices
   * 
   * @param topic - Topic to search for
   * @returns Best practice documentation
   */
  async searchBestPractices(topic: string): Promise<CAPDocSearchResult[]> {
    return this.searchDocs(`${topic} best practices`, 5);
  }

  /**
   * Get CAP annotations documentation
   * 
   * @param annotationType - Type of annotation (e.g., 'UI', 'Common', 'Core')
   * @returns Annotation documentation
   */
  async getAnnotationDocs(annotationType?: string): Promise<CAPDocSearchResult[]> {
    const query = annotationType
      ? `@${annotationType} annotations`
      : 'annotations';
    return this.searchDocs(query, 10);
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
 * Helper function to create a CAP client for a project
 * 
 * @param projectPath - Path to CAP project root
 * @returns Configured SAP CAP client
 */
export function createCAPClient(projectPath: string): SAPCAPClient {
  return new SAPCAPClient(projectPath);
}
