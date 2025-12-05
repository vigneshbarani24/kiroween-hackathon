import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/resurrections/:id/spec/progress
 * Get spec completion progress for a resurrection
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

    // Read tasks.md to count tasks
    const tasksContent = await fs.readFile(path.join(specDir, 'tasks.md'), 'utf-8');
    
    // Count total tasks (lines starting with "- [ ]" or "- [x]")
    const taskLines = tasksContent.split('\n').filter((line: string) => 
      line.trim().match(/^- \[([ x])\]/)
    );
    const tasksTotal = taskLines.length;
    const tasksCompleted = taskLines.filter((line: string) => 
      line.includes('- [x]')
    ).length;

    // Read requirements.md to count requirements
    const requirementsContent = await fs.readFile(path.join(specDir, 'requirements.md'), 'utf-8');
    const requirementsCount = (requirementsContent.match(/### Requirement \d+/g) || []).length;

    // Read design.md to count properties
    const designContent = await fs.readFile(path.join(specDir, 'design.md'), 'utf-8');
    const propertiesCount = (designContent.match(/### Property \d+:/g) || []).length;

    return NextResponse.json({
      success: true,
      progress: {
        tasksCompleted,
        tasksTotal,
        completionPercentage: tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0,
        requirementsCount,
        propertiesCount,
        specPath: `.kiro/specs/resurrection-${projectName}`,
      },
    });
  } catch (err) {
    console.error('Error reading spec progress:', err);
    return NextResponse.json(
      { error: 'Failed to read spec progress', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
