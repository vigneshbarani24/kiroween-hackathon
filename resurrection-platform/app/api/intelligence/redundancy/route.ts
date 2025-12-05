/**
 * Redundancy Detection API
 * 
 * Endpoints for detecting duplicate and similar ABAP code
 * Implements requirement 6.6: redundancy detection with similarity scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RedundancyDetector, ABAPObject } from '@/lib/intelligence/redundancy-detector';
import { SavingsCalculator } from '@/lib/intelligence/savings-calculator';

const prisma = new PrismaClient();

/**
 * POST /api/intelligence/redundancy
 * Detect redundancies in uploaded ABAP objects
 * 
 * Request body:
 * {
 *   "abapObjectIds": string[] // Optional: specific objects to analyze
 *   "threshold": number // Optional: similarity threshold (default 0.85)
 *   "userId": string // Optional: filter by user
 * }
 * 
 * Response:
 * {
 *   "redundancies": Redundancy[]
 *   "statistics": RedundancyStatistics
 *   "clusters": RedundancyCluster[]
 *   "consolidationPlan": ConsolidationPlan
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abapObjectIds, threshold = 0.85, userId } = body;
    
    // Fetch ABAP objects from database
    let abapObjects;
    if (abapObjectIds && abapObjectIds.length > 0) {
      abapObjects = await prisma.aBAPObject.findMany({
        where: {
          id: { in: abapObjectIds }
        }
      });
    } else if (userId) {
      // Get ABAP objects through resurrections for this user
      abapObjects = await prisma.aBAPObject.findMany({
        where: {
          resurrection: {
            userId: userId
          }
        }
      });
    } else {
      // Get all ABAP objects (limit to 100 for performance)
      abapObjects = await prisma.aBAPObject.findMany({
        take: 100,
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    
    if (abapObjects.length < 2) {
      return NextResponse.json({
        redundancies: [],
        statistics: {
          totalRedundancies: 0,
          highSimilarity: 0,
          mediumSimilarity: 0,
          totalPotentialSavings: 0,
          byModule: {},
          byType: {}
        },
        clusters: [],
        consolidationPlan: {
          priority: 'low',
          items: [],
          totalSavings: 0,
          estimatedEffort: '0 hours'
        },
        message: 'Need at least 2 ABAP objects to detect redundancies'
      });
    }
    
    // Convert to ABAPObject format
    const files: ABAPObject[] = abapObjects.map((obj: any) => ({
      id: obj.id,
      name: obj.name,
      content: obj.content,
      type: obj.type,
      module: obj.module || 'UNKNOWN',
      linesOfCode: obj.linesOfCode || 0,
      metadata: obj.metadata as Record<string, any> || {}
    }));
    
    // Initialize detector with custom threshold
    const detector = new RedundancyDetector(threshold);
    
    // Find redundancies
    console.log(`🔍 Detecting redundancies in ${files.length} ABAP objects...`);
    const redundancies = await detector.findRedundancies(files);
    
    // Get statistics
    const statistics = detector.getStatistics(redundancies);
    
    // Find clusters
    const clusters = await detector.findClusters(files);
    
    // Generate consolidation plan
    const consolidationPlan = await detector.generateConsolidationPlan(redundancies);
    
    // Calculate detailed savings
    const savingsCalculator = new SavingsCalculator();
    const totalLOC = files.reduce((sum, f) => sum + f.linesOfCode, 0);
    const savingsProjection = savingsCalculator.calculateProjection(redundancies, totalLOC);
    const detailedSavings = savingsCalculator.calculateDetailedSavings(redundancies, statistics);
    const quickWins = savingsCalculator.identifyQuickWins(redundancies);
    const prioritizedRedundancies = savingsCalculator.rankByPriority(redundancies);
    const savingsSummary = savingsCalculator.generateSummary(savingsProjection);
    
    console.log(`✅ Found ${redundancies.length} redundancies`);
    console.log(`📊 Statistics:`, statistics);
    console.log(`💰 Savings projection:`, savingsProjection);
    
    return NextResponse.json({
      redundancies: prioritizedRedundancies,
      statistics,
      clusters,
      consolidationPlan,
      savingsProjection,
      detailedSavings,
      quickWins,
      savingsSummary,
      message: `Found ${redundancies.length} redundancies with ${statistics.totalPotentialSavings} LOC potential savings`
    });
    
  } catch (err) {
    console.error('❌ Error detecting redundancies:', err);
    return NextResponse.json(
      { 
        error: 'Failed to detect redundancies',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intelligence/redundancy?userId=xxx
 * Get cached redundancy analysis results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
    
    // Fetch ABAP objects for user through resurrections
    const abapObjects = await prisma.aBAPObject.findMany({
      where: {
        resurrection: {
          userId: userId
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        module: true,
        linesOfCode: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      abapObjects,
      count: abapObjects.length,
      message: `Found ${abapObjects.length} ABAP objects for user ${userId}`
    });
    
  } catch (err) {
    console.error('❌ Error fetching ABAP objects:', err);
    return NextResponse.json(
      { 
        error: 'Failed to fetch ABAP objects',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
