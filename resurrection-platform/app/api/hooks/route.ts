/**
 * Hooks API - List and Create
 * 
 * GET /api/hooks - List all hooks
 * POST /api/hooks - Create new hook
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

export async function GET(request: NextRequest) {
  try {
    const hooks = await hookManager.getHooks();

    return NextResponse.json({
      hooks,
      count: hooks.length
    });
  } catch (error) {
    console.error('[API] Failed to get hooks:', error);
    return NextResponse.json(
      { error: 'Failed to get hooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const hook = await request.json();

    // Generate ID if not provided
    if (!hook.id) {
      hook.id = `hook-${Date.now()}`;
    }

    await hookManager.upsertHook(hook);

    return NextResponse.json(hook, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create hook:', error);
    return NextResponse.json(
      { error: 'Failed to create hook' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const hook = await request.json();

    if (!hook.id) {
      return NextResponse.json(
        { error: 'Hook ID is required' },
        { status: 400 }
      );
    }

    await hookManager.upsertHook(hook);

    return NextResponse.json(hook);
  } catch (error) {
    console.error('[API] Failed to update hook:', error);
    return NextResponse.json(
      { error: 'Failed to update hook' },
      { status: 500 }
    );
  }
}
