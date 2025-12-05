/**
 * Fit-to-Standard API Endpoint
 * 
 * GET /api/intelligence/fit-to-standard?abapObjectId=xxx
 * - Get fit-to-standard recommendations for an ABAP object
 * 
 * Implements Requirement 6.7: Fit-to-standard recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFitToStandardService } from '@/lib/intelligence/fit-to-standard-service';
import { getImplementationGuide, formatGuideAsMarkdown } from '@/lib/intelligence/implementation-guides';
import { getStandardById } from '@/lib/intelligence/sap-standards-kb';

/**
 * GET /api/intelligence/fit-to-standard
 * 
 * Query parameters:
 * - abapObjectId: ID of ABAP object to analyze
 * - minConfidence: Minimum confidence threshold (default: 0.5)
 * - maxRecommendations: Maximum number of recommendations (default: 5)
 * - includeGuides: Include implementation guides (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const abapObjectId = searchParams.get('abapObjectId');
    
    if (!abapObjectId) {
      return NextResponse.json(
        { error: 'abapObjectId is required' },
        { status: 400 }
      );
    }
    
    // Parse options
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.5');
    const maxRecommendations = parseInt(searchParams.get('maxRecommendations') || '5');
    const includeGuides = searchParams.get('includeGuides') === 'true';
    
    // TODO: Fetch ABAP object from database
    // For now, using mock data
    const mockABAPObject = {
      id: abapObjectId,
      name: 'Z_CUSTOM_PRICING',
      module: 'SD',
      code: `FUNCTION Z_CUSTOM_PRICING.
  * Custom pricing calculation
  DATA: lv_price TYPE p DECIMALS 2.
  
  SELECT SINGLE netpr INTO lv_price
    FROM KONV
    WHERE kschl = 'PR00'
      AND matnr = material.
  
  IF sy-subrc = 0.
    * Apply discount
    lv_price = lv_price * ( 1 - discount / 100 ).
    
    * Add tax
    lv_price = lv_price * ( 1 + tax_rate / 100 ).
  ENDIF.
  
  final_price = lv_price.
ENDFUNCTION.`,
      tables: ['KONV', 'VBAP'],
      operations: ['pricing calculation', 'discount application', 'tax calculation'],
      businessLogic: ['Calculate base price', 'Apply discount', 'Add tax']
    };
    
    // Create analysis object
    const analysis = {
      code: mockABAPObject.code,
      module: mockABAPObject.module as 'SD' | 'MM' | 'FI' | 'CO' | 'HR' | 'PP' | 'CROSS',
      functionName: mockABAPObject.name,
      tables: mockABAPObject.tables,
      operations: mockABAPObject.operations,
      businessLogic: mockABAPObject.businessLogic
    };
    
    // Generate recommendations
    const fitToStandardService = createFitToStandardService();
    const recommendations = await fitToStandardService.generateRecommendations(
      abapObjectId,
      mockABAPObject.name,
      analysis,
      {
        minConfidence,
        maxRecommendations,
        includeCodeExamples: true
      }
    );
    
    // Add implementation guides if requested
    if (includeGuides) {
      for (const recommendation of recommendations) {
        const standard = getStandardById(recommendation.standardAlternative);
        if (standard) {
          const guide = getImplementationGuide(standard);
          (recommendation as any).implementationGuideDetailed = guide;
          (recommendation as any).implementationGuideMarkdown = formatGuideAsMarkdown(guide);
        }
      }
    }
    
    return NextResponse.json({
      abapObjectId,
      abapObjectName: mockABAPObject.name,
      module: mockABAPObject.module,
      recommendationsCount: recommendations.length,
      recommendations
    });
    
  } catch (err) {
    console.error('Fit-to-standard error:', err);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intelligence/fit-to-standard
 * 
 * Body:
 * {
 *   abapObjectId: string,
 *   abapObjectName: string,
 *   analysis: ABAPAnalysis,
 *   options?: RecommendationOptions
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abapObjectId, abapObjectName, analysis, options } = body;
    
    if (!abapObjectId || !abapObjectName || !analysis) {
      return NextResponse.json(
        { error: 'abapObjectId, abapObjectName, and analysis are required' },
        { status: 400 }
      );
    }
    
    // Generate recommendations
    const fitToStandardService = createFitToStandardService();
    const recommendations = await fitToStandardService.generateRecommendations(
      abapObjectId,
      abapObjectName,
      analysis,
      options || {}
    );
    
    // Add implementation guides
    for (const recommendation of recommendations) {
      const standard = getStandardById(recommendation.standardAlternative);
      if (standard) {
        const guide = getImplementationGuide(standard);
        (recommendation as any).implementationGuideDetailed = guide;
        (recommendation as any).implementationGuideMarkdown = formatGuideAsMarkdown(guide);
      }
    }
    
    return NextResponse.json({
      abapObjectId,
      abapObjectName,
      module: analysis.module,
      recommendationsCount: recommendations.length,
      recommendations
    });
    
  } catch (err) {
    console.error('Fit-to-standard error:', err);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
