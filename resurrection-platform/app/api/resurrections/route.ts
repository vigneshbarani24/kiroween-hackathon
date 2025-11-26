import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/resurrections - Create new resurrection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, module, abapCode, userId } = body;

    // Validation
    if (!abapCode || typeof abapCode !== 'string' || abapCode.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'abapCode is required and must be a non-empty string'
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'name is required and must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Calculate lines of code
    const linesOfCode = abapCode.split('\n').length;

    // Get or create default user
    let defaultUserId = userId;
    if (!defaultUserId) {
      const defaultUser = await prisma.user.findUnique({
        where: { email: 'default@resurrection.local' }
      });
      
      if (!defaultUser) {
        // Create default user if it doesn't exist
        const newUser = await prisma.user.create({
          data: {
            email: 'default@resurrection.local',
            name: 'Default User'
          }
        });
        defaultUserId = newUser.id;
      } else {
        defaultUserId = defaultUser.id;
      }
    }

    // Create resurrection with initial workflow steps
    const resurrection = await prisma.resurrection.create({
      data: {
        name,
        description: description || null,
        status: 'analyzing',
        module: module || 'CUSTOM',
        abapCode,
        linesOfCode,
        userId: defaultUserId,
        workflowSteps: {
          create: [
            { stepNumber: 1, stepName: 'ANALYZE', status: 'NOT_STARTED' },
            { stepNumber: 2, stepName: 'PLAN', status: 'NOT_STARTED' },
            { stepNumber: 3, stepName: 'GENERATE', status: 'NOT_STARTED' },
            { stepNumber: 4, stepName: 'VALIDATE', status: 'NOT_STARTED' },
            { stepNumber: 5, stepName: 'DEPLOY', status: 'NOT_STARTED' }
          ]
        }
      },
      include: {
        workflowSteps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });

    // TODO: Start resurrection workflow asynchronously
    // This will be implemented when the workflow engine is integrated
    // For now, we just create the resurrection record

    return NextResponse.json({
      success: true,
      message: 'Resurrection created successfully',
      resurrectionId: resurrection.id,
      resurrection: {
        id: resurrection.id,
        name: resurrection.name,
        description: resurrection.description,
        status: resurrection.status,
        module: resurrection.module,
        linesOfCode: resurrection.linesOfCode,
        workflowSteps: resurrection.workflowSteps,
        createdAt: resurrection.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating resurrection:', error);
    return NextResponse.json(
      { 
        error: 'Creation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET /api/resurrections - List all resurrections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const module = searchParams.get('module');

    // Get default user
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'default@resurrection.local' }
    });

    const where: any = {};
    if (defaultUser) {
      where.userId = defaultUser.id;
    }
    if (status) where.status = status;
    if (module) where.module = module;

    const resurrections = await prisma.resurrection.findMany({
      where,
      include: {
        abapObjects: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        _count: {
          select: {
            transformationLogs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      count: resurrections.length,
      resurrections: resurrections.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        module: r.module,
        githubUrl: r.githubUrl,
        basUrl: r.basUrl,
        originalLOC: r.originalLOC,
        locSaved: r.locSaved,
        qualityScore: r.qualityScore,
        abapObjectCount: r.abapObjects.length,
        transformationLogCount: r._count.transformationLogs,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching resurrections:', error);
    return NextResponse.json(
      { 
        error: 'Fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
