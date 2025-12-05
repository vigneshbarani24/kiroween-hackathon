import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// GET /api/resurrections/:id/export - Export resurrection as .zip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch resurrection with all necessary data
    const resurrection = await prisma.resurrection.findUnique({
      where: { id },
      include: {
        abapObjects: {
          select: {
            name: true,
            type: true,
            content: true,
            linesOfCode: true
          }
        },
        transformationLogs: {
          where: {
            step: 'GENERATE',
            status: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!resurrection) {
      return NextResponse.json(
        { error: 'Resurrection not found' },
        { status: 404 }
      );
    }

    // Check if resurrection has been generated
    if (resurrection.status !== 'COMPLETED' && resurrection.status !== 'DEPLOYING') {
      return NextResponse.json(
        { 
          error: 'Resurrection not ready for export',
          message: `Current status: ${resurrection.status}. Resurrection must be completed before export.`
        },
        { status: 400 }
      );
    }

    // Get generated CAP project from transformation logs
    const generationLog = resurrection.transformationLogs[0];
    if (!generationLog || !generationLog.response) {
      return NextResponse.json(
        { 
          error: 'No generated code found',
          message: 'CAP project generation data not available'
        },
        { status: 404 }
      );
    }

    const capProject = generationLog.response as any;

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err) => controller.error(err));
      }
    });

    // Add files to archive
    const projectName = `resurrection-${resurrection.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Database files
    if (capProject.db) {
      for (const [filename, content] of Object.entries(capProject.db)) {
        archive.append(content as string, { name: `${projectName}/db/${filename}` });
      }
    }

    // Service files
    if (capProject.srv) {
      for (const [filename, content] of Object.entries(capProject.srv)) {
        archive.append(content as string, { name: `${projectName}/srv/${filename}` });
      }
    }

    // App files
    if (capProject.app) {
      for (const [filename, content] of Object.entries(capProject.app)) {
        archive.append(content as string, { name: `${projectName}/app/${filename}` });
      }
    }

    // Root files
    if (capProject.packageJson) {
      archive.append(
        typeof capProject.packageJson === 'string' 
          ? capProject.packageJson 
          : JSON.stringify(capProject.packageJson, null, 2),
        { name: `${projectName}/package.json` }
      );
    }

    if (capProject.mtaYaml) {
      archive.append(capProject.mtaYaml, { name: `${projectName}/mta.yaml` });
    }

    if (capProject.xsSecurity) {
      archive.append(
        typeof capProject.xsSecurity === 'string'
          ? capProject.xsSecurity
          : JSON.stringify(capProject.xsSecurity, null, 2),
        { name: `${projectName}/xs-security.json` }
      );
    }

    if (capProject.gitignore) {
      archive.append(capProject.gitignore, { name: `${projectName}/.gitignore` });
    }

    // Generate README with git instructions
    const readme = generateReadmeWithGitInstructions(resurrection, projectName);
    archive.append(readme, { name: `${projectName}/README.md` });

    // Generate RESURRECTION.md with original ABAP context
    const resurrectionDoc = generateResurrectionDoc(resurrection);
    archive.append(resurrectionDoc, { name: `${projectName}/RESURRECTION.md` });

    // Finalize archive
    archive.finalize();

    // Return as downloadable file
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}.zip"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (err) {
    console.error('Error exporting resurrection:', err);
    return NextResponse.json(
      { 
        error: 'Export failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

function generateReadmeWithGitInstructions(resurrection: any, projectName: string): string {
  return `# ${resurrection.name}

🔄 This CAP application was resurrected from legacy ABAP code.

## Original ABAP Context
- **Module:** ${resurrection.module}
- **Objects:** ${resurrection.abapObjects.map((o: any) => o.name).join(', ')}
- **Original LOC:** ${resurrection.originalLOC}
- **Transformation Date:** ${new Date(resurrection.createdAt).toLocaleDateString()}

## Local Development

### Prerequisites
- Node.js 18+
- @sap/cds-dk

### Setup
\`\`\`bash
npm install
cds watch
\`\`\`

Access at: http://localhost:4004

## Git Setup (Manual Push)

If you want to push this project to your own GitHub repository:

### 1. Initialize Git Repository
\`\`\`bash
cd ${projectName}
git init
\`\`\`

### 2. Add All Files
\`\`\`bash
git add .
\`\`\`

### 3. Create Initial Commit
\`\`\`bash
git commit -m "🔄 Resurrection: ABAP to CAP transformation complete"
\`\`\`

### 4. Create GitHub Repository
Go to https://github.com/new and create a new repository named \`${projectName}\`

### 5. Add Remote and Push
\`\`\`bash
git remote add origin https://github.com/YOUR_USERNAME/${projectName}.git
git branch -M main
git push -u origin main
\`\`\`

## Deploy to SAP BTP

### Prerequisites
- Cloud Foundry CLI
- MTA Build Tool
- SAP BTP account

### Deployment
\`\`\`bash
# Login to Cloud Foundry
cf login -a https://api.cf.{region}.hana.ondemand.com

# Build MTA
mbt build

# Deploy
cf deploy mta_archives/${projectName}_1.0.0.mtar
\`\`\`

## Open in SAP Business Application Studio

After pushing to GitHub, you can open in BAS:
https://bas.{region}.hana.ondemand.com/?gitClone=https://github.com/YOUR_USERNAME/${projectName}

## Architecture

- **Database:** SAP HANA Cloud (HDI Container)
- **Backend:** SAP CAP (Node.js)
- **Frontend:** SAP Fiori Elements
- **Authentication:** XSUAA

## Business Logic Preserved

All ABAP business logic has been preserved:
- Data structures
- Business rules
- Validation logic
- Authorization checks

See RESURRECTION.md for detailed transformation notes.

---

Generated by SAP Legacy AI Alternative - Resurrection Platform
`;
}

function generateResurrectionDoc(resurrection: any): string {
  return `# Resurrection Documentation

## Transformation Summary

**Resurrection ID:** ${resurrection.id}
**Name:** ${resurrection.name}
**Status:** ${resurrection.status}
**Module:** ${resurrection.module}

## Original ABAP Objects

${resurrection.abapObjects.map((obj: any) => `
### ${obj.name} (${obj.type})
- **Lines of Code:** ${obj.linesOfCode}
- **Type:** ${obj.type}

\`\`\`abap
${obj.content.substring(0, 500)}${obj.content.length > 500 ? '...\n[truncated]' : ''}
\`\`\`
`).join('\n')}

## Transformation Metrics

- **Original LOC:** ${resurrection.originalLOC}
- **Transformed LOC:** ${resurrection.transformedLOC || 'N/A'}
- **LOC Saved:** ${resurrection.locSaved || 'N/A'}
- **Quality Score:** ${resurrection.qualityScore ? `${resurrection.qualityScore}%` : 'N/A'}
- **Complexity Score:** ${resurrection.complexityScore || 'N/A'}

## GitHub Integration

${resurrection.githubUrl ? `
- **Repository:** ${resurrection.githubUrl}
- **Method:** ${resurrection.githubMethod}
- **BAS Link:** ${resurrection.basUrl || 'N/A'}
` : 'Not yet deployed to GitHub'}

## Transformation Date

**Created:** ${new Date(resurrection.createdAt).toLocaleString()}
**Last Updated:** ${new Date(resurrection.updatedAt).toLocaleString()}

---

This resurrection was generated by the SAP Legacy AI Alternative platform.
For more information, visit: https://github.com/your-org/resurrection-platform
`;
}
