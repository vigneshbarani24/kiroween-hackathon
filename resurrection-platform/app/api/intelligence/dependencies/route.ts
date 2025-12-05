/**
 * Dependencies API
 * 
 * Provides dependency graph data for visualization
 * Implements Requirement 6.3: dependency graph data
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all ABAP objects with their dependencies
    const abapObjects = await prisma.aBAPObject.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        module: true,
        linesOfCode: true,
        dependencies: true,
      }
    });

    // Build nodes
    const nodes = abapObjects.map(obj => ({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      module: obj.module,
      linesOfCode: obj.linesOfCode || 0,
      dependencies: obj.dependencies as string[] || []
    }));

    // Build links from dependencies
    const links: Array<{ source: string; target: string; type: string }> = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    abapObjects.forEach(obj => {
      const deps = obj.dependencies as any;
      if (deps && Array.isArray(deps)) {
        deps.forEach((depId: string) => {
          // Only create link if target node exists
          if (nodeIds.has(depId)) {
            links.push({
              source: obj.id,
              target: depId,
              type: 'calls' // Default type, could be enhanced
            });
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        links
      }
    });

  } catch (err) {
    console.error('Error fetching dependencies:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dependencies',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
