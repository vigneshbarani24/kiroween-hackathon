import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resurrections/:id/steps - Get workflow steps with SSE streaming
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const stream = searchParams.get('stream') === 'true';

    // Verify resurrection exists
    const resurrection = await prisma.resurrection.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    // If streaming is requested, use Server-Sent Events
    if (stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial workflow steps
            const steps = await prisma.workflowStep.findMany({
              where: { resurrectionId: id },
              orderBy: { stepNumber: 'asc' }
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'initial', steps })}\n\n`)
            );

            // Poll for updates every 2 seconds
            const pollInterval = setInterval(async () => {
              try {
                const updatedSteps = await prisma.workflowStep.findMany({
                  where: { resurrectionId: id },
                  orderBy: { stepNumber: 'asc' }
                });

                const updatedResurrection = await prisma.resurrection.findUnique({
                  where: { id },
                  select: { status: true }
                });

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'update', 
                    steps: updatedSteps,
                    status: updatedResurrection?.status 
                  })}\n\n`)
                );

                // Stop streaming if resurrection is completed or failed
                if (updatedResurrection?.status === 'completed' || 
                    updatedResurrection?.status === 'failed') {
                  clearInterval(pollInterval);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
                  );
                  controller.close();
                }
              } catch (err) {
                console.error('Error polling workflow steps:', err);
                clearInterval(pollInterval);
                controller.error(error);
              }
            }, 2000);

            // Clean up on client disconnect
            request.signal.addEventListener('abort', () => {
              clearInterval(pollInterval);
              controller.close();
            });

          } catch (err) {
            console.error('Error starting SSE stream:', err);
            controller.error(error);
          }
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response - just return current steps
    const steps = await prisma.workflowStep.findMany({
      where: { resurrectionId: id },
      orderBy: { stepNumber: 'asc' },
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
    });

    return NextResponse.json({
      success: true,
      resurrectionId: id,
      status: resurrection.status,
      steps
    }, { status: 200 });

  } catch (err) {
    console.error('Error fetching workflow steps:', err);
    return NextResponse.json(
      { 
        error: 'Fetch failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
