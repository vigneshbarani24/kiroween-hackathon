/**
 * Hook Executions API
 * 
 * GET /api/resurrections/:id/hooks/executions - Get hook execution history
 * 
 * Requirements: 11.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const executions = await prisma.hookExecution.findMany({
      where: {
        resurrectionId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      executions,
      count: executions.length
    });
  } catch (err) {
    console.error('[API] Failed to get hook executions:', err);
    return NextResponse.json(
      { error: 'Failed to get hook executions' },
      { status: 500 }
    );
  }
}
