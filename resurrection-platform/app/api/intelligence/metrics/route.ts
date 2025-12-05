/**
 * Intelligence Metrics API
 * 
 * Provides dashboard metrics for the Intelligence Dashboard
 * Implements Requirement 6.1: display key metrics
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all ABAP objects
    const abapObjects = await prisma.aBAPObject.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        module: true,
        linesOfCode: true,
      }
    });

    // Calculate metrics
    const totalObjects = abapObjects.length;
    const totalLOC = abapObjects.reduce((sum, obj) => sum + (obj.linesOfCode || 0), 0);

    // Count by module
    const byModule: Record<string, number> = {};
    abapObjects.forEach(obj => {
      byModule[obj.module] = (byModule[obj.module] || 0) + 1;
    });

    // Count by type
    const byType: Record<string, number> = {};
    abapObjects.forEach(obj => {
      byType[obj.type] = (byType[obj.type] || 0) + 1;
    });

    // Get redundancy count (if available)
    let redundancies = 0;
    try {
      const redundancyRecords = await prisma.redundancy.count();
      redundancies = redundancyRecords;
    } catch (err) {
      // Redundancy table might not exist yet
      console.log('Redundancy table not available:', error);
    }

    // Get fit-to-standard count (if available)
    let fitToStandardOpportunities = 0;
    try {
      const fitToStandardRecords = await prisma.fitToStandardRecommendation.count();
      fitToStandardOpportunities = fitToStandardRecords;
    } catch (err) {
      // FitToStandardRecommendation table might not exist yet
      console.log('FitToStandardRecommendation table not available:', error);
    }

    const metrics = {
      totalObjects,
      totalLOC,
      redundancies,
      fitToStandardOpportunities,
      byModule,
      byType
    };

    return NextResponse.json({ 
      success: true,
      metrics 
    });

  } catch (err) {
    console.error('Error fetching intelligence metrics:', err);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch intelligence metrics',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
