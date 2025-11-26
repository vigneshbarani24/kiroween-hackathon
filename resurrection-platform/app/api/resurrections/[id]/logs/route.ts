/**
 * Resurrection MCP Logs API Route
 * 
 * GET /api/resurrections/[id]/logs - Get MCP logs for a specific resurrection
 * Requirements: 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpLogger } from '@/lib/mcp/mcp-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resurrectionId = params.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const filter = {
      serverName: searchParams.get('serverName') || undefined,
      toolName: searchParams.get('toolName') || undefined,
      status: searchParams.get('status') as 'success' | 'error' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Check if export is requested
    const exportFormat = searchParams.get('export');
    if (exportFormat === 'json') {
      const jsonData = await mcpLogger.exportLogsAsJSON({ 
        resurrectionId,
        ...filter 
      });
      
      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="mcp-logs-${resurrectionId}-${Date.now()}.json"`
        }
      });
    }

    // Get logs for this resurrection
    const logs = await mcpLogger.getLogsForResurrection(resurrectionId, filter);
    
    // Get statistics
    const stats = await mcpLogger.getLogStats(resurrectionId);

    return NextResponse.json({
      success: true,
      resurrectionId,
      logs,
      stats,
      count: logs.length,
      filter
    });
  } catch (error) {
    console.error('[API] Error fetching resurrection MCP logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch resurrection MCP logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
