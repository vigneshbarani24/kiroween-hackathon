import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resurrectionId = params.id;

    // Fetch quality report for this resurrection
    const qualityReport = await prisma.qualityReport.findFirst({
      where: { resurrectionId }
    });

    if (!qualityReport) {
      return NextResponse.json(
        { error: 'Quality report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(qualityReport);
  } catch (error) {
    console.error('Error fetching quality report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality report' },
      { status: 500 }
    );
  }
}
