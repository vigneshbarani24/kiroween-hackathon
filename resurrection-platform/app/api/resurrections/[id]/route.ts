import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resurrections/:id - Get resurrection details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resurrection = await prisma.resurrection.findUnique({
      where: { id },
      include: {
        abapObjects: {
          select: {
            id: true,
            name: true,
            type: true,
            module: true,
            linesOfCode: true
          }
        },
        workflowSteps: {
          orderBy: {
            stepNumber: 'asc'
          },
          select: {
            id: true,
            stepNumber: true,
            stepName: true,
            status: true,
            startedAt: true,
            completedAt: true,
            output: true,
            error: true,
            createdAt: true,
            updatedAt: true
          }
        },
        mcpLogs: {
          orderBy: {
            calledAt: 'desc'
          },
          select: {
            id: true,
            serverName: true,
            toolName: true,
            params: true,
            response: true,
            error: true,
            durationMs: true,
            calledAt: true
          }
        },
        transformationLogs: {
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            step: true,
            status: true,
            duration: true,
            errorMessage: true,
            request: true,
            response: true,
            createdAt: true
          }
        },
        qualityReports: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        githubActivities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resurrection: {
        id: resurrection.id,
        name: resurrection.name,
        description: resurrection.description,
        status: resurrection.status,
        module: resurrection.module,
        abapCode: resurrection.abapCode,
        abapAnalysis: resurrection.abapAnalysis,
        transformationPlan: resurrection.transformationPlan,
        githubRepo: resurrection.githubRepo,
        githubUrl: resurrection.githubUrl,
        githubMethod: resurrection.githubMethod,
        basUrl: resurrection.basUrl,
        deploymentUrl: resurrection.deploymentUrl,
        deploymentStatus: resurrection.deploymentStatus,
        originalLOC: resurrection.originalLOC,
        transformedLOC: resurrection.transformedLOC,
        locSaved: resurrection.locSaved,
        linesOfCode: resurrection.linesOfCode,
        complexity: resurrection.complexity,
        complexityScore: resurrection.complexityScore,
        qualityScore: resurrection.qualityScore,
        completedAt: resurrection.completedAt,
        abapObjects: resurrection.abapObjects,
        workflowSteps: resurrection.workflowSteps,
        mcpLogs: resurrection.mcpLogs,
        transformationLogs: resurrection.transformationLogs,
        qualityReports: resurrection.qualityReports,
        githubActivities: resurrection.githubActivities,
        createdAt: resurrection.createdAt,
        updatedAt: resurrection.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching resurrection:', error);
    return NextResponse.json(
      { 
        error: 'Fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
