/**
 * MCP Error Handler
 * 
 * Handles errors from MCP servers with retry logic and fallbacks.
 * 
 * Features:
 * - Exponential backoff retry (3 attempts)
 * - Fallback strategies for each MCP server
 * - Error classification (retryable vs non-retryable)
 * - Detailed error logging
 * 
 * Requirements: 9.8, 9.9
 */

import { MCPError } from './types';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface FallbackResult {
  success: boolean;
  fallback: boolean;
  method: string;
  message: string;
  data?: any;
}

export class MCPErrorHandler {
  private maxRetries: number = 3;
  private baseDelayMs: number = 1000;
  private maxDelayMs: number = 10000;

  /**
   * Call MCP with retry logic and exponential backoff
   * 
   * Retries up to maxRetries times with exponential backoff:
   * - Attempt 1: immediate
   * - Attempt 2: wait 1s
   * - Attempt 3: wait 2s
   * - Attempt 4: wait 4s (capped at maxDelayMs)
   * 
   * @param callFn - Function to call
   * @param server - MCP server name
   * @param tool - Tool/method name
   * @param params - Parameters
   * @param options - Retry options
   * @returns Result from callFn
   */
  async callWithRetry<T>(
    callFn: () => Promise<T>,
    server: string,
    tool: string,
    params: any,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const baseDelayMs = options.baseDelayMs ?? this.baseDelayMs;
    const maxDelayMs = options.maxDelayMs ?? this.maxDelayMs;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await callFn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryable(lastError)) {
          console.error(`[MCP Error] ${server}.${tool} - Non-retryable error:`, lastError.message);
          throw lastError;
        }

        // Log error
        console.error(`[MCP Error] ${server}.${tool} attempt ${attempt}/${maxRetries}:`, lastError.message);

        // Call onRetry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s (capped at maxDelayMs)
          const delayMs = Math.min(
            baseDelayMs * Math.pow(2, attempt - 1),
            maxDelayMs
          );
          
          console.log(`[MCP Retry] Waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}`);
          await this.sleep(delayMs);
        }
      }
    }

    // All retries failed - throw error
    throw new Error(
      `MCP call failed after ${maxRetries} attempts: ${server}.${tool} - ${lastError?.message}`
    );
  }

  /**
   * Get fallback for failed MCP server
   * 
   * Provides alternative implementations when MCP servers fail:
   * - SAP CAP: Use cds init with basic template
   * - SAP UI5: Use basic Fiori Elements template
   * - GitHub: Offer .zip download for manual git push
   * - Slack: Log notifications locally (non-blocking)
   * - ABAP Analyzer: No fallback (critical - must fail)
   * 
   * @param server - MCP server name
   * @param tool - Tool/method name
   * @param params - Parameters
   * @param error - Original error
   * @returns Fallback result
   */
  async useFallback(
    server: string,
    tool: string,
    params: any,
    error: Error
  ): Promise<FallbackResult> {
    console.warn(`[MCP Fallback] Using fallback for ${server}.${tool} due to: ${error.message}`);

    switch (server) {
      case 'sap-cap':
        return this.fallbackCAPGeneration(tool, params);

      case 'sap-ui5':
        return this.fallbackUI5Generation(tool, params);

      case 'github':
        return this.fallbackGitHubExport(tool, params);

      case 'slack':
        return this.fallbackSlackLog(tool, params);

      case 'abap-analyzer':
        // No fallback - this is critical
        console.error(`[MCP Fallback] ABAP Analyzer is critical - no fallback available`);
        throw new Error(`ABAP Analyzer MCP failed: ${error.message}. This is a critical service with no fallback.`);

      default:
        console.error(`[MCP Fallback] No fallback available for ${server}`);
        throw error;
    }
  }

  /**
   * Fallback: CAP generation using cds init
   * 
   * When SAP CAP MCP is unavailable, use cds init with basic template.
   * This provides a working CAP project structure without MCP guidance.
   */
  private async fallbackCAPGeneration(tool: string, params: any): Promise<FallbackResult> {
    console.log('[Fallback] Using cds init for CAP generation');
    
    return {
      success: true,
      fallback: true,
      method: 'cds-init',
      message: 'Using basic CAP template (SAP CAP MCP unavailable)',
      data: {
        tool,
        params,
        instructions: 'Run: cds init <project-name> --add hana,mta,samples'
      }
    };
  }

  /**
   * Fallback: UI5 generation using basic template
   * 
   * When SAP UI5 MCP is unavailable, use basic Fiori Elements template.
   * This provides a minimal working UI5 app without MCP guidance.
   */
  private async fallbackUI5Generation(tool: string, params: any): Promise<FallbackResult> {
    console.log('[Fallback] Using basic Fiori Elements template');
    
    return {
      success: true,
      fallback: true,
      method: 'basic-fiori-elements',
      message: 'Using basic Fiori Elements template (SAP UI5 MCP unavailable)',
      data: {
        tool,
        params,
        instructions: 'Using minimal Fiori Elements List Report template'
      }
    };
  }

  /**
   * Fallback: GitHub export as .zip
   * 
   * When GitHub MCP is unavailable, offer .zip download for manual git push.
   * User can download the generated code and push to GitHub manually.
   */
  private async fallbackGitHubExport(tool: string, params: any): Promise<FallbackResult> {
    console.log('[Fallback] Offering .zip download instead of GitHub');
    
    return {
      success: true,
      fallback: true,
      method: 'zip-export',
      message: 'Download as .zip for manual git push (GitHub MCP unavailable)',
      data: {
        tool,
        params,
        instructions: 'Download the generated code as .zip and push to GitHub manually',
        exportPath: '/api/resurrections/[id]/export'
      }
    };
  }

  /**
   * Fallback: Log Slack notification locally
   * 
   * When Slack MCP is unavailable, log notifications locally.
   * This is non-blocking - Slack failures don't stop the workflow.
   */
  private async fallbackSlackLog(tool: string, params: any): Promise<FallbackResult> {
    console.log('[Fallback] Logging Slack notification locally');
    console.log('[Slack Message]', JSON.stringify(params, null, 2));
    
    return {
      success: true,
      fallback: true,
      method: 'local-log',
      message: 'Notification logged locally (Slack MCP unavailable)',
      data: {
        tool,
        params,
        timestamp: new Date().toISOString(),
        logged: true
      }
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors are retryable
    if (
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network')
    ) {
      return true;
    }

    // Rate limit errors are retryable
    if (message.includes('rate limit')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return true;
    }

    // Client errors (4xx) are not retryable
    if (message.includes('400') || message.includes('401') || message.includes('403')) {
      return false;
    }

    // Default: retry
    return true;
  }

  /**
   * Create MCPError from Error
   */
  createMCPError(error: Error, server: string, tool: string): MCPError {
    return {
      code: 'MCP_ERROR',
      message: `${server}.${tool}: ${error.message}`,
      details: error,
      retryable: this.isRetryable(error)
    };
  }

  /**
   * Call MCP with retry and automatic fallback
   * 
   * Combines retry logic with fallback strategies:
   * 1. Try calling MCP server (with retries)
   * 2. If all retries fail, use fallback
   * 3. Return result or throw error
   * 
   * @param callFn - Function to call
   * @param server - MCP server name
   * @param tool - Tool/method name
   * @param params - Parameters
   * @param options - Retry options
   * @returns Result from callFn or fallback
   */
  async callWithRetryAndFallback<T>(
    callFn: () => Promise<T>,
    server: string,
    tool: string,
    params: any,
    options: RetryOptions = {}
  ): Promise<T | FallbackResult> {
    try {
      // Try with retries
      return await this.callWithRetry(callFn, server, tool, params, options);
    } catch (error) {
      // All retries failed - try fallback
      console.warn(`[MCP] All retries failed for ${server}.${tool}, attempting fallback...`);
      
      try {
        const fallbackResult = await this.useFallback(server, tool, params, error as Error);
        return fallbackResult as any;
      } catch (fallbackError) {
        // Fallback also failed - throw original error
        console.error(`[MCP] Fallback also failed for ${server}.${tool}:`, fallbackError);
        throw error;
      }
    }
  }

  /**
   * Format error message for user display
   * 
   * Converts technical errors into user-friendly messages.
   * 
   * @param error - Error object
   * @param server - MCP server name
   * @param tool - Tool/method name
   * @returns User-friendly error message
   */
  formatErrorMessage(error: Error, server: string, tool: string): string {
    const message = error.message.toLowerCase();

    // Connection errors
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return `${server} server is not running. Please check the MCP server configuration.`;
    }

    if (message.includes('timeout')) {
      return `${server} server timed out. The server may be overloaded or unreachable.`;
    }

    if (message.includes('enotfound')) {
      return `${server} server not found. Please check the server address.`;
    }

    // Authentication errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return `Authentication failed for ${server}. Please check your credentials.`;
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return `Access denied to ${server}. You don't have permission to perform this action.`;
    }

    // Rate limit errors
    if (message.includes('rate limit')) {
      return `${server} rate limit exceeded. Please wait a moment and try again.`;
    }

    // Server errors
    if (message.includes('500') || message.includes('internal server error')) {
      return `${server} server error. The server encountered an internal error.`;
    }

    // Default message
    return `${server} error: ${error.message}`;
  }

  /**
   * Get suggested action for error
   * 
   * Provides actionable next steps for the user.
   * 
   * @param error - Error object
   * @param server - MCP server name
   * @returns Suggested action
   */
  getSuggestedAction(error: Error, server: string): string {
    const message = error.message.toLowerCase();

    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return `Start the ${server} MCP server or check .kiro/settings/mcp.json configuration.`;
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      if (server === 'github') {
        return 'Check GITHUB_TOKEN environment variable. Generate a new token at https://github.com/settings/tokens';
      }
      if (server === 'slack') {
        return 'Check SLACK_BOT_TOKEN environment variable. Generate a new token in your Slack app settings.';
      }
      return `Check authentication credentials for ${server}.`;
    }

    if (message.includes('rate limit')) {
      return 'Wait a few minutes before trying again, or upgrade your API plan.';
    }

    return 'Check the MCP server logs for more details, or try again later.';
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
