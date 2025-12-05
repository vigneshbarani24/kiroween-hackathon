import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/resurrections - Create new resurrection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, module, abapCode, abapObjectIds, userId } = body;

    // Validation - either abapCode OR abapObjectIds must be provided
    if (!abapCode && (!abapObjectIds || !Array.isArray(abapObjectIds) || abapObjectIds.length === 0)) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Either abapCode or abapObjectIds must be provided'
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
    let linesOfCode = 0;
    let finalAbapCode = abapCode;
    
    if (abapObjectIds && abapObjectIds.length > 0) {
      // Fetch ABAP objects and combine their code
      const abapObjects = await prisma.aBAPObject.findMany({
        where: {
          id: { in: abapObjectIds }
        }
      });
      
      if (abapObjects.length === 0) {
        return NextResponse.json(
          { 
            error: 'Invalid request',
            message: 'No valid ABAP objects found with provided IDs'
          },
          { status: 400 }
        );
      }
      
      // Combine all ABAP code
      finalAbapCode = abapObjects.map(obj => obj.content).join('\n\n');
      linesOfCode = abapObjects.reduce((sum, obj) => sum + obj.linesOfCode, 0);
    } else if (abapCode) {
      linesOfCode = abapCode.split('\n').length;
    }

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
        abapCode: finalAbapCode,
        linesOfCode,
        originalLOC: linesOfCode,
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

    // Link ABAP objects to resurrection if provided
    if (abapObjectIds && abapObjectIds.length > 0) {
      await prisma.aBAPObject.updateMany({
        where: {
          id: { in: abapObjectIds }
        },
        data: {
          resurrectionId: resurrection.id
        }
      });
    }

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

  } catch (err) {
    console.error('Error creating resurrection:', err);
    return NextResponse.json(
      {
        error: 'Creation failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
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
        originalLOC: r.originalLOC || r.linesOfCode || 0,
        locSaved: r.locSaved || 0,
        qualityScore: r.qualityScore || 0,
        abapObjectCount: r.abapObjects.length,
        transformationLogCount: r._count.transformationLogs,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    }, { status: 200 });

  } catch (err) {
    console.error('Error fetching resurrections:', err);
    return NextResponse.json(
      {
        error: 'Fetch failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
