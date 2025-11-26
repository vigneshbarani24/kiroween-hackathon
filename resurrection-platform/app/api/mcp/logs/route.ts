/**
 * MCP Logs API Route
 * 
 * GET /api/mcp/logs - Get all MCP logs with filtering
 * Requirements: 12.5, 12.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpLogger } from '@/lib/mcp/mcp-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const filter = {
      resurrectionId: searchParams.get('resurrectionId') || undefined,
      serverName: searchParams.get('serverName') || undefined,
      toolName: searchParams.get('toolName') || undefined,
      status: searchParams.get('status') as 'success' | 'error' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    };

    // Check if export is requested
    const exportFormat = searchParams.get('export');
    if (exportFormat === 'json') {
      const jsonData = await mcpLogger.exportLogsAsJSON(filter);
      
      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="mcp-logs-${Date.now()}.json"`
        }
      });
    }

    // Check if search is requested
    const searchTerm = searchParams.get('search');
    let logs;
    
    if (searchTerm) {
      logs = await mcpLogger.searchLogs(searchTerm, filter);
    } else {
      logs = await mcpLogger.getAllLogs(filter);
    }

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      filter
    });
  } catch (error) {
    console.error('[API] Error fetching MCP logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch MCP logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
