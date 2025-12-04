/**
 * Hooks API - Individual Hook Operations
 * 
 * GET /api/hooks/:id - Get hook by ID
 * PATCH /api/hooks/:id - Update hook (partial)
 * DELETE /api/hooks/:id - Delete hook
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hook = await hookManager.getHook(id);

    if (!hook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(hook);
  } catch (error) {
    console.error('[API] Failed to get hook:', error);
    return NextResponse.json(
      { error: 'Failed to get hook' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const existingHook = await hookManager.getHook(id);

    if (!existingHook) {
      return NextResponse.json(
        { error: 'Hook not found' },
        { status: 404 }
      );
    }

    const updatedHook = { ...existingHook, ...updates };
    await hookManager.upsertHook(updatedHook);

    return NextResponse.json(updatedHook);
  } catch (error) {
    console.error('[API] Failed to update hook:', error);
    return NextResponse.json(
      { error: 'Failed to update hook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await hookManager.deleteHook(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete hook:', error);
    return NextResponse.json(
      { error: 'Failed to delete hook' },
      { status: 500 }
    );
  }
}
