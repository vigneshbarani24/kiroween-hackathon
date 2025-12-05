/**
 * Hooks API - Manual Trigger
 * 
 * POST /api/hooks/:id/trigger - Manually trigger a hook
 * 
 * Requirements: 11.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { HookManager } from '@/lib/hooks/hook-manager';
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const mcpOrchestrator = new MCPOrchestrator({
  servers: []
});
const hookManager = new HookManager(mcpOrchestrator);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await request.json();
    const hook = await hookManager.getHook(id);

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    // Trigger the hook with provided context
    const results = await hookManager.trigger(hook.trigger as any, context);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('[API] Failed to trigger hook:', err);
    return NextResponse.json(
      { error: 'Failed to trigger hook' },
      { status: 500 }
    );
  }
}
