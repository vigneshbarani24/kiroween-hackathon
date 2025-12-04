
import { NextRequest, NextResponse } from 'next/server';
import { UnifiedMCPClient } from '@/lib/mcp/unified-mcp-client';
import { MCPProcessManager } from '@/lib/mcp/mcp-process-manager';
import { createLLMService } from '@/lib/llm/llm-service';
import { join } from 'path';

// Maximum duration for the analysis process (60 seconds)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  console.log('[API] Starting ABAP analysis (LLM Mode)...');
  
  // const processManager = new MCPProcessManager();
  // let mcpClient: UnifiedMCPClient | null = null;
  let code = '';

  try {
    // 1. Parse request body
    const body = await req.json();
    code = body.code;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "code" field' },
        { status: 400 }
      );
    }

    console.log(`[API] Received ABAP code (${code.length} chars)`);

    // DIRECT LLM MODE (As requested by User)
    console.log('[API] Using Direct LLM Analysis...');
    const llmService = createLLMService();
    const llmAnalysis = await llmService.analyzeABAPWithLLM(code);
    
    console.log('[API] LLM Analysis complete');

    return NextResponse.json({
      analysis: {
        ...llmAnalysis,
        source: 'LLM (Direct)'
      }
    });

    /* MCP CODE DISABLED FOR STABILITY
    try {
      // 2. Try MCP Servers First
      console.log('[API] Attempting analysis with MCP servers...');
      
      // ... (MCP startup code) ...

    } catch (mcpError) {
      // ... (Fallback code) ...
    }
    */

  } catch (error) {
    console.error('[API] Analysis failed completely:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  } finally {
    // Cleanup
    console.log('[API] Cleaning up...');
    // if (mcpClient) {
    //   try { await mcpClient.disconnect(); } catch (e) { console.error('Client disconnect error:', e); }
    // }
    // try { await processManager.stopAll(); } catch (e) { console.error('Server stop error:', e); }
  }
}
