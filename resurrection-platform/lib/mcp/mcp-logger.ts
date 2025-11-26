/**
 * MCP Logger Service
 * 
 * Logs all MCP interactions for debugging and monitoring
 * Requirements: 12.1, 12.2
 */

import { PrismaClient } from '@prisma/client';
import { MCPLogEntry } from '../workflow/types';

const prisma = new PrismaClient();

export interface MCPLogFilter {
  resurrectionId?: string;
  serverName?: string;
  toolName?: string;
  status?: 'success' | 'error';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class MCPLogger {
  private debugMode: boolean;
  private inMemoryLogs: MCPLogEntry[] = [];

  constructor() {
    // Enable debug mode via environment variable
    this.debugMode = process.env.MCP_DEBUG_MODE === 'true';
  }

  /**
   * Log an MCP call with full details
   * Requirements: 12.1, 12.2
   */
  async logCall(
    resurrectionId: string | null,
    serverName: string,
    toolName: string,
    params: any,
    response?: any,
    error?: string,
    durationMs?: number
  ): Promise<void> {
    const logEntry: MCPLogEntry = {
      id: this.generateId(),
      resurrectionId: resurrectionId || '',
      serverName,
      toolName,
      params: this.debugMode ? params : this.truncateParams(params),
      response: response ? (this.debugMode ? response : this.truncateResponse(response)) : undefined,
      error,
      durationMs: durationMs || 0,
      calledAt: new Date()
    };

    // Store in memory for quick access
    this.inMemoryLogs.push(logEntry);

    // Log to console
    this.logToConsole(logEntry);

    // Store in database
    try {
      await this.storeInDatabase(logEntry);
    } catch (dbError) {
      console.error('[MCPLogger] Failed to store log in database:', dbError);
      // Don't throw - logging should not break the workflow
    }
  }

  /**
   * Get logs for a resurrection with filtering
   * Requirements: 12.5
   */
  async getLogsForResurrection(
    resurrectionId: string,
    filter?: Omit<MCPLogFilter, 'resurrectionId'>
  ): Promise<MCPLogEntry[]> {
    try {
      const logs = await prisma.mCPLog.findMany({
        where: {
          resurrectionId,
          serverName: filter?.serverName,
          toolName: filter?.toolName,
          error: filter?.status === 'error' ? { not: null } : filter?.status === 'success' ? null : undefined,
          calledAt: {
            gte: filter?.startDate,
            lte: filter?.endDate
          }
        },
        orderBy: {
          calledAt: 'desc'
        },
        take: filter?.limit || 100,
        skip: filter?.offset || 0
      });

      return logs.map(log => ({
        id: log.id,
        resurrectionId: log.resurrectionId || '',
        serverName: log.serverName,
        toolName: log.toolName,
        params: log.params,
        response: log.response,
        error: log.error || undefined,
        durationMs: log.durationMs || 0,
        calledAt: log.calledAt
      }));
    } catch (error) {
      console.error('[MCPLogger] Failed to fetch logs from database:', error);
      // Fallback to in-memory logs
      return this.inMemoryLogs.filter(log => log.resurrectionId === resurrectionId);
    }
  }

  /**
   * Get all logs with filtering
   * Requirements: 12.5
   */
  async getAllLogs(filter?: MCPLogFilter): Promise<MCPLogEntry[]> {
    try {
      const logs = await prisma.mCPLog.findMany({
        where: {
          resurrectionId: filter?.resurrectionId || undefined,
          serverName: filter?.serverName,
          toolName: filter?.toolName,
          error: filter?.status === 'error' ? { not: null } : filter?.status === 'success' ? null : undefined,
          calledAt: {
            gte: filter?.startDate,
            lte: filter?.endDate
          }
        },
        orderBy: {
          calledAt: 'desc'
        },
        take: filter?.limit || 100,
        skip: filter?.offset || 0
      });

      return logs.map(log => ({
        id: log.id,
        resurrectionId: log.resurrectionId || '',
        serverName: log.serverName,
        toolName: log.toolName,
        params: log.params,
        response: log.response,
        error: log.error || undefined,
        durationMs: log.durationMs || 0,
        calledAt: log.calledAt
      }));
    } catch (error) {
      console.error('[MCPLogger] Failed to fetch logs from database:', error);
      return this.inMemoryLogs;
    }
  }

  /**
   * Search logs by content
   * Requirements: 12.6
   */
  async searchLogs(searchTerm: string, filter?: MCPLogFilter): Promise<MCPLogEntry[]> {
    try {
      // Note: This is a simple implementation. For production, consider using full-text search
      const logs = await this.getAllLogs(filter);
      
      return logs.filter(log => {
        const searchableContent = JSON.stringify({
          serverName: log.serverName,
          toolName: log.toolName,
          params: log.params,
          response: log.response,
          error: log.error
        }).toLowerCase();
        
        return searchableContent.includes(searchTerm.toLowerCase());
      });
    } catch (error) {
      console.error('[MCPLogger] Failed to search logs:', error);
      return [];
    }
  }

  /**
   * Export logs as JSON
   * Requirements: 12.7
   */
  async exportLogsAsJSON(filter?: MCPLogFilter): Promise<string> {
    const logs = await this.getAllLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get log statistics for a resurrection
   */
  async getLogStats(resurrectionId: string): Promise<{
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    callsByServer: Record<string, number>;
    callsByTool: Record<string, number>;
  }> {
    const logs = await this.getLogsForResurrection(resurrectionId);

    const stats = {
      totalCalls: logs.length,
      successfulCalls: logs.filter(log => !log.error).length,
      failedCalls: logs.filter(log => log.error).length,
      averageDuration: logs.length > 0 
        ? logs.reduce((sum, log) => sum + log.durationMs, 0) / logs.length 
        : 0,
      callsByServer: {} as Record<string, number>,
      callsByTool: {} as Record<string, number>
    };

    logs.forEach(log => {
      stats.callsByServer[log.serverName] = (stats.callsByServer[log.serverName] || 0) + 1;
      stats.callsByTool[log.toolName] = (stats.callsByTool[log.toolName] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear in-memory logs (database logs remain)
   */
  clearMemoryLogs(): void {
    this.inMemoryLogs = [];
  }

  /**
   * Delete old logs from database
   * Requirements: 12.9 (archive logs older than 30 days)
   */
  async archiveOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.mCPLog.deleteMany({
        where: {
          calledAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`[MCPLogger] Archived ${result.count} logs older than ${daysToKeep} days`);
      return result.count;
    } catch (error) {
      console.error('[MCPLogger] Failed to archive old logs:', error);
      return 0;
    }
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
        this.debugMode ? entry.error : this.truncateString(entry.error, 200)
      );
    } else {
      console.log(
        `[MCP] ${timestamp} | ${entry.serverName}.${entry.toolName} | ✅ SUCCESS | ${duration}`
      );
    }

    // In debug mode, log full request/response
    if (this.debugMode) {
      console.log('[MCP] Params:', entry.params);
      if (entry.response) {
        console.log('[MCP] Response:', entry.response);
      }
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
   * Truncate string to specified length
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Store log entry in database
   * Requirements: 12.1, 12.2
   */
  private async storeInDatabase(entry: MCPLogEntry): Promise<void> {
    await prisma.mCPLog.create({
      data: {
        id: entry.id,
        resurrectionId: entry.resurrectionId || null,
        serverName: entry.serverName,
        toolName: entry.toolName,
        params: entry.params,
        response: entry.response,
        error: entry.error || null,
        durationMs: entry.durationMs,
        calledAt: entry.calledAt
      }
    });
  }

  /**
   * Enable or disable debug mode
   * Requirements: 12.8
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[MCPLogger] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }
}

// Singleton instance
export const mcpLogger = new MCPLogger();
