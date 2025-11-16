/**
 * Analysis API Routes
 * Analyze ABAP code patterns using Kiro MCP tools
 */

import { Router } from 'express';
import { execSync } from 'child_process';
import path from 'path';

const router = Router();

/**
 * POST /api/analyze
 * Analyze ABAP code using MCP tools
 */
router.post('/', async (req, res) => {
  try {
    const { abapCode, analysisType = 'all' } = req.body;

    if (!abapCode) {
      return res.status(400).json({
        error: 'ABAP code is required'
      });
    }

    console.log(`🔍 Analyzing ABAP code (${analysisType})...`);

    // In a real implementation, this would call the MCP server
    // For demo purposes, we'll simulate the analysis
    const analysis = simulateABAPAnalysis(abapCode, analysisType);

    res.json({
      success: true,
      analysis,
      mcpTools: ['parse_abap', 'detect_sap_patterns'],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * Simulate ABAP analysis (would call MCP server in production)
 */
function simulateABAPAnalysis(code: string, type: string) {
  const analysis: any = {
    patterns: {}
  };

  // Detect database operations
  const selectMatches = code.match(/SELECT.*FROM\s+(\w+)/gi);
  if (selectMatches) {
    analysis.patterns.database = selectMatches.map(match => {
      const table = match.match(/FROM\s+(\w+)/i)?.[1];
      return {
        type: 'SELECT',
        table: table?.toUpperCase(),
        description: getTableDescription(table?.toUpperCase())
      };
    });
  }

  // Detect SAP patterns
  if (code.match(/BAPI_/i)) {
    analysis.patterns.bapis = ['Found BAPI calls'];
  }

  if (code.match(/pricing|discount|kbetr/i)) {
    analysis.patterns.pricing = true;
  }

  if (code.match(/AUTHORITY-CHECK/i)) {
    analysis.patterns.authorization = true;
  }

  // Detect business logic patterns
  const ifMatches = code.match(/IF\s+.*\./gi);
  if (ifMatches) {
    analysis.patterns.validations = ifMatches.length;
  }

  return analysis;
}

function getTableDescription(table?: string): string {
  const tables: Record<string, string> = {
    'VBAK': 'Sales Document Header',
    'VBAP': 'Sales Document Items',
    'KNA1': 'Customer Master',
    'MARA': 'Material Master',
    'KONV': 'Pricing Conditions'
  };

  return table ? (tables[table] || 'SAP Table') : 'Unknown';
}

export { router as analyzeRouter };
