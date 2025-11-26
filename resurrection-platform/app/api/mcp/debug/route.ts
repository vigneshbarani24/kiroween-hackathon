/**
 * MCP Debug Mode API Route
 * 
 * GET /api/mcp/debug - Get debug mode status
 * POST /api/mcp/debug - Toggle debug mode
 * Requirements: 12.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpLogger } from '@/lib/mcp/mcp-logger';

export async function GET() {
  try {
    const isDebugMode = mcpLogger.isDebugMode();
    
    return NextResponse.json({
      success: true,
      debugMode: isDebugMode,
      message: isDebugMode 
        ? 'Debug mode is enabled - full request/response payloads are being logged'
        : 'Debug mode is disabled - payloads are truncated for performance'
    });
  } catch (error) {
    console.error('[API] Error getting debug mode status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get debug mode status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: 'enabled must be a boolean'
        },
        { status: 400 }
      );
    }
    
    mcpLogger.setDebugMode(enabled);
    
    return NextResponse.json({
      success: true,
      debugMode: enabled,
      message: enabled 
        ? 'Debug mode enabled - full request/response payloads will be logged'
        : 'Debug mode disabled - payloads will be truncated for performance'
    });
  } catch (error) {
    console.error('[API] Error toggling debug mode:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle debug mode',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
