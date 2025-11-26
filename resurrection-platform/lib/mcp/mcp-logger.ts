/**
 * MCP Logger Service
 * 
 * Logs all MCP interactions for debugging and monitoring
 */

import { MCPLogEntry } from '../workflow/types';

export class MCPLogger {
  private logs: MCPLogEntry[] = [];

  /**
   * Log an MCP call
   */
  async logCall(
    resurrectionId: string,
    serverName: string,
    toolName: string,
    params: any,
    response?: any,
    error?: string,
    durationMs?: number
  ): Promise<void> {
    const logEntry: MCPLogEntry = {
      id: this.generateId(),
      resurrectionId,
      serverName,
      toolName,
      params: this.truncateParams(params),
      response: response ? this.truncateResponse(response) : undefined,
      error,
      durationMs: durationMs || 0,
      calledAt: new Date()
    };

    this.logs.push(logEntry);

    // Log to console
    this.logToConsole(logEntry);

    // TODO: Store in database
    // await this.storeInDatabase(logEntry);
  }

  /**
   * Get logs for a resurrection
   */
  getLogsForResurrection(resurrectionId: string): MCPLogEntry[] {
    return this.logs.filter(log => log.resurrectionId === resurrectionId);
  }

  /**
   * Get all logs
   */
  getAllLogs(): MCPLogEntry[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: MCPLogEntry): void {
    const timestamp = entry.calledAt.toISOString();
    const duration = entry.durationMs ? `${entry.durationMs}ms` : 'N/A';

    if (entry.error) {
      console.error(
        `[MCP] ${timestamp} | ${entry.serverName}.${entry.toolName} | ❌ ERROR | ${duration}`,
        entry.error
      );
    } else {
      console.log(
        `[MCP] ${timestamp} | ${entry.serverName}.${entry.toolName} | ✅ SUCCESS | ${duration}`
      );
    }
  }

  /**
   * Truncate params for logging (avoid huge logs)
   */
  private truncateParams(params: any): any {
    if (!params) return params;

    const str = JSON.stringify(params);
    if (str.length > 1000) {
      return {
        _truncated: true,
        _originalLength: str.length,
        _preview: str.substring(0, 1000) + '...'
      };
    }

    return params;
  }

  /**
   * Truncate response for logging
   */
  private truncateResponse(response: any): any {
    if (!response) return response;

    const str = JSON.stringify(response);
    if (str.length > 1000) {
      return {
        _truncated: true,
        _originalLength: str.length,
        _preview: str.substring(0, 1000) + '...'
      };
    }

    return response;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Store log entry in database
   */
  private async storeInDatabase(entry: MCPLogEntry): Promise<void> {
    // TODO: Implement database storage
    // await prisma.mcpLog.create({ data: entry });
  }
}

// Singleton instance
export const mcpLogger = new MCPLogger();
