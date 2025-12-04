/**
 * Deployment API
 * 
 * POST /api/resurrections/:id/deploy - Trigger deployment to SAP BTP
 * 
 * Requirements: 11.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { HookManager } from '@/lib/hooks/hook-manager';
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const prisma = new PrismaClient();
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
    const { deploymentUrl, status } = await request.json();

    // Get resurrection
    const resurrection = await prisma.resurrection.findUnique({
      where: { id }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    // Update resurrection with deployment info
    await prisma.resurrection.update({
      where: { id },
      data: {
        deploymentUrl,
        deploymentStatus: status
      }
    });

    // Trigger appropriate hook based on deployment status
    if (status === 'SUCCESS') {
      await hookManager.trigger('deployment.succeeded', {
        resurrectionId: id,
        resurrection: {
          ...resurrection,
          deploymentUrl
        },
        deployment: {
          url: deploymentUrl,
          status: 'SUCCESS',
          timestamp: new Date()
        }
      });
    } else if (status === 'FAILED') {
      await hookManager.trigger('deployment.failed', {
        resurrectionId: id,
        resurrection,
        deployment: {
          status: 'FAILED',
          timestamp: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      deploymentUrl,
      status
    });
  } catch (error) {
    console.error('[API] Failed to update deployment status:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment status' },
      { status: 500 }
    );
  }
}
