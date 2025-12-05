import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resurrections/:id/status - Get workflow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resurrection = await prisma.resurrection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        githubUrl: true,
        basUrl: true,
        qualityScore: true,
        updatedAt: true,
        transformationLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          select: {
            step: true,
            status: true,
            duration: true,
            errorMessage: true,
            createdAt: true
          }
        }
      }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    // Map status to workflow steps
    const statusToSteps: Record<string, any> = {
      'UPLOADED': {
        currentStep: 0,
        steps: [
          { name: 'ANALYZE', status: 'PENDING' },
          { name: 'PLAN', status: 'PENDING' },
          { name: 'GENERATE', status: 'PENDING' },
          { name: 'VALIDATE', status: 'PENDING' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      },
      'ANALYZING': {
        currentStep: 1,
        steps: [
          { name: 'ANALYZE', status: 'IN_PROGRESS' },
          { name: 'PLAN', status: 'PENDING' },
          { name: 'GENERATE', status: 'PENDING' },
          { name: 'VALIDATE', status: 'PENDING' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      },
      'PLANNING': {
        currentStep: 2,
        steps: [
          { name: 'ANALYZE', status: 'COMPLETED' },
          { name: 'PLAN', status: 'IN_PROGRESS' },
          { name: 'GENERATE', status: 'PENDING' },
          { name: 'VALIDATE', status: 'PENDING' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      },
      'GENERATING': {
        currentStep: 3,
        steps: [
          { name: 'ANALYZE', status: 'COMPLETED' },
          { name: 'PLAN', status: 'COMPLETED' },
          { name: 'GENERATE', status: 'IN_PROGRESS' },
          { name: 'VALIDATE', status: 'PENDING' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      },
      'VALIDATING': {
        currentStep: 4,
        steps: [
          { name: 'ANALYZE', status: 'COMPLETED' },
          { name: 'PLAN', status: 'COMPLETED' },
          { name: 'GENERATE', status: 'COMPLETED' },
          { name: 'VALIDATE', status: 'IN_PROGRESS' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      },
      'DEPLOYING': {
        currentStep: 5,
        steps: [
          { name: 'ANALYZE', status: 'COMPLETED' },
          { name: 'PLAN', status: 'COMPLETED' },
          { name: 'GENERATE', status: 'COMPLETED' },
          { name: 'VALIDATE', status: 'COMPLETED' },
          { name: 'DEPLOY', status: 'IN_PROGRESS' }
        ]
      },
      'COMPLETED': {
        currentStep: 5,
        steps: [
          { name: 'ANALYZE', status: 'COMPLETED' },
          { name: 'PLAN', status: 'COMPLETED' },
          { name: 'GENERATE', status: 'COMPLETED' },
          { name: 'VALIDATE', status: 'COMPLETED' },
          { name: 'DEPLOY', status: 'COMPLETED' }
        ]
      },
      'FAILED': {
        currentStep: -1,
        steps: [
          { name: 'ANALYZE', status: 'FAILED' },
          { name: 'PLAN', status: 'PENDING' },
          { name: 'GENERATE', status: 'PENDING' },
          { name: 'VALIDATE', status: 'PENDING' },
          { name: 'DEPLOY', status: 'PENDING' }
        ]
      }
    };

    const workflowInfo = statusToSteps[resurrection.status] || statusToSteps['UPLOADED'];

    // Calculate progress percentage
    const completedSteps = workflowInfo.steps.filter((s: any) => s.status === 'COMPLETED').length;
    const progressPercentage = (completedSteps / 5) * 100;

    // Determine if workflow is complete
    const isComplete = resurrection.status === 'COMPLETED';
    const isFailed = resurrection.status === 'FAILED';
    const isInProgress = !isComplete && !isFailed && resurrection.status !== 'UPLOADED';

    return NextResponse.json({
      success: true,
      resurrection: {
        id: resurrection.id,
        name: resurrection.name,
        status: resurrection.status,
        isComplete,
        isFailed,
        isInProgress,
        progressPercentage,
        currentStep: workflowInfo.currentStep,
        steps: workflowInfo.steps,
        githubUrl: resurrection.githubUrl,
        basUrl: resurrection.basUrl,
        qualityScore: resurrection.qualityScore,
        recentLogs: resurrection.transformationLogs,
        lastUpdated: resurrection.updatedAt
      }
    }, { status: 200 });

  } catch (err) {
    console.error('Error fetching resurrection status:', err);
    return NextResponse.json(
      { 
        error: 'Status fetch failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
