import { NextRequest, NextResponse } from 'next/server';
import { KiroSpecGenerator } from '@/lib/specs/kiro-spec-generator';

/**
 * POST /api/resurrections/:id/spec
 * Generate Kiro spec documents for a resurrection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { projectName, analysis } = body;

    if (!projectName || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, analysis' },
        { status: 400 }
      );
    }

    // Generate spec
    const generator = new KiroSpecGenerator();
    const spec = await generator.generateSpec(projectName, analysis);

    // Save spec files
    await generator.saveSpecFiles(id, projectName, spec);

    return NextResponse.json({
      success: true,
      spec,
      specPath: `.kiro/specs/resurrection-${projectName}`,
    });
  } catch (error) {
    console.error('Error generating spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate spec', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resurrections/:id/spec
 * Get existing spec for a resurrection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('projectName');

    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing projectName parameter' },
        { status: 400 }
      );
    }

    const fs = require('fs').promises;
    const path = require('path');

    const specDir = path.join(process.cwd(), '.kiro', 'specs', `resurrection-${projectName}`);

    // Check if spec exists
    try {
      await fs.access(specDir);
    } catch {
      return NextResponse.json(
        { error: 'Spec not found' },
        { status: 404 }
      );
    }

    // Read spec files
    const requirements = await fs.readFile(path.join(specDir, 'requirements.md'), 'utf-8');
    const design = await fs.readFile(path.join(specDir, 'design.md'), 'utf-8');
    const tasks = await fs.readFile(path.join(specDir, 'tasks.md'), 'utf-8');

    return NextResponse.json({
      success: true,
      spec: {
        requirements,
        design,
        tasks,
      },
      specPath: `.kiro/specs/resurrection-${projectName}`,
    });
  } catch (error) {
    console.error('Error reading spec:', error);
    return NextResponse.json(
      { error: 'Failed to read spec', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
