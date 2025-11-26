import { NextRequest, NextResponse } from 'next/server';
import { UnifiedMCPClient } from '@/lib/mcp/unified-mcp-client';

// Singleton MCP client instance
let mcpClient: UnifiedMCPClient | null = null;

/**
 * GET /api/mcp/health - Check health of all 5 MCP servers
 * 
 * Returns the connection status and health of each MCP server:
 * - ABAP Analyzer MCP
 * - SAP CAP MCP
 * - SAP UI5 MCP
 * - GitHub MCP
 * - Slack MCP
 * 
 * Requirements: 4.6
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize MCP client if not already initialized
    if (!mcpClient) {
      mcpClient = new UnifiedMCPClient({
        autoConnect: true,
        githubToken: process.env.GITHUB_TOKEN,
        slackBotToken: process.env.SLACK_BOT_TOKEN
      });
    }

    // Initialize connections if needed
    if (!mcpClient.isInitialized()) {
      try {
        await mcpClient.initializeConnections();
      } catch (error) {
        console.error('[MCP Health] Failed to initialize MCP client:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to initialize MCP connections',
          message: error instanceof Error ? error.message : 'Unknown error',
          servers: {
            abapAnalyzer: { connected: false, status: 'DISCONNECTED', error: 'Initialization failed' },
            sapCAP: { connected: false, status: 'DISCONNECTED', error: 'Initialization failed' },
            sapUI5: { connected: false, status: 'DISCONNECTED', error: 'Initialization failed' },
            github: { connected: false, status: 'DISCONNECTED', error: 'Initialization failed' },
            slack: { connected: false, status: 'DISCONNECTED', error: 'Initialization failed' }
          },
          allHealthy: false,
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    }

    // Perform health check
    const healthStatus = await mcpClient.healthCheck();

    // Return health status
    return NextResponse.json({
      success: true,
      servers: {
        abapAnalyzer: {
          name: 'ABAP Analyzer MCP',
          connected: healthStatus.abapAnalyzer.connected,
          status: healthStatus.abapAnalyzer.status,
          error: healthStatus.abapAnalyzer.lastError,
          description: 'Parses and analyzes ABAP code'
        },
        sapCAP: {
          name: 'SAP CAP MCP',
          connected: healthStatus.sapCAP.connected,
          status: healthStatus.sapCAP.status,
          error: healthStatus.sapCAP.lastError,
          description: 'Provides CAP patterns and documentation'
        },
        sapUI5: {
          name: 'SAP UI5 MCP',
          connected: healthStatus.sapUI5.connected,
          status: healthStatus.sapUI5.status,
          error: healthStatus.sapUI5.lastError,
          description: 'Generates UI5/Fiori applications'
        },
        github: {
          name: 'GitHub MCP',
          connected: healthStatus.github.connected,
          status: healthStatus.github.status,
          error: healthStatus.github.lastError,
          description: 'Creates repositories and commits files'
        },
        slack: {
          name: 'Slack MCP',
          connected: healthStatus.slack.connected,
          status: healthStatus.slack.status,
          error: healthStatus.slack.lastError,
          description: 'Sends team notifications'
        }
      },
      allHealthy: healthStatus.allHealthy,
      timestamp: healthStatus.timestamp.toISOString(),
      summary: {
        total: 5,
        healthy: [
          healthStatus.abapAnalyzer.connected,
          healthStatus.sapCAP.connected,
          healthStatus.sapUI5.connected,
          healthStatus.github.connected,
          healthStatus.slack.connected
        ].filter(Boolean).length,
        unhealthy: [
          !healthStatus.abapAnalyzer.connected,
          !healthStatus.sapCAP.connected,
          !healthStatus.sapUI5.connected,
          !healthStatus.github.connected,
          !healthStatus.slack.connected
        ].filter(Boolean).length
      }
    }, { 
      status: healthStatus.allHealthy ? 200 : 503 
    });

  } catch (error) {
    console.error('[MCP Health] Health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      servers: {
        abapAnalyzer: { connected: false, status: 'UNKNOWN', error: 'Health check failed' },
        sapCAP: { connected: false, status: 'UNKNOWN', error: 'Health check failed' },
        sapUI5: { connected: false, status: 'UNKNOWN', error: 'Health check failed' },
        github: { connected: false, status: 'UNKNOWN', error: 'Health check failed' },
        slack: { connected: false, status: 'UNKNOWN', error: 'Health check failed' }
      },
      allHealthy: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
