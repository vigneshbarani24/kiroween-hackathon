import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/resurrections/:id/start - Start 5-step workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify resurrection exists
    const resurrection = await prisma.resurrection.findUnique({
      where: { id },
      include: {
        abapObjects: true
      }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    // Check if already in progress or completed
    if (['ANALYZING', 'PLANNING', 'GENERATING', 'VALIDATING', 'DEPLOYING'].includes(resurrection.status)) {
      return NextResponse.json(
        { 
          error: 'Workflow already in progress',
          message: `Current status: ${resurrection.status}`
        },
        { status: 409 }
      );
    }

    if (resurrection.status === 'COMPLETED') {
      return NextResponse.json(
        { 
          error: 'Resurrection already completed',
          message: 'This resurrection has already been transformed'
        },
        { status: 409 }
      );
    }

    // Verify ABAP objects exist
    if (!resurrection.abapObjects || resurrection.abapObjects.length === 0) {
      return NextResponse.json(
        { 
          error: 'No ABAP objects',
          message: 'Resurrection must have at least one ABAP object'
        },
        { status: 400 }
      );
    }

    // Combine all ABAP code
    const combinedABAPCode = resurrection.abapObjects
      .map(obj => `* ${obj.name} (${obj.type})\n${obj.content}`)
      .join('\n\n');

    // Update status to indicate workflow started
    await prisma.resurrection.update({
      where: { id },
      data: { 
        status: 'ANALYZING',
        updatedAt: new Date()
      }
    });

    // Start workflow asynchronously (don't await - let it run in background)
    // Use HYBRID workflow (CAP CLI + GitHub API + OpenAI analysis)
    const { HybridResurrectionWorkflow } = await import('@/lib/workflow/hybrid-workflow');
    const workflow = new HybridResurrectionWorkflow();
    
    // Execute workflow in background
    workflow.execute(id, combinedABAPCode)
      .then(result => {
        console.log(`Resurrection ${id} completed successfully:`, result);
      })
      .catch(error => {
        console.error(`Resurrection ${id} failed:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Resurrection workflow started',
      resurrection: {
        id: resurrection.id,
        name: resurrection.name,
        status: 'ANALYZING',
        estimatedDuration: '3-5 minutes',
        steps: [
          { name: 'ANALYZE', status: 'IN_PROGRESS', description: 'Analyzing ABAP code' },
          { name: 'PLAN', status: 'PENDING', description: 'Creating transformation plan' },
          { name: 'GENERATE', status: 'PENDING', description: 'Generating CAP application' },
          { name: 'VALIDATE', status: 'PENDING', description: 'Validating output' },
          { name: 'DEPLOY', status: 'PENDING', description: 'Creating GitHub repository' }
        ]
      }
    }, { status: 202 }); // 202 Accepted - processing started

  } catch (error) {
    console.error('Error starting resurrection workflow:', error);
    
    // Update resurrection status to FAILED
    try {
      const { id: failedId } = await params;
      await prisma.resurrection.update({
        where: { id: failedId },
        data: { 
          status: 'FAILED',
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('Error updating resurrection status:', updateError);
    }

    return NextResponse.json(
      { 
        error: 'Workflow start failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
