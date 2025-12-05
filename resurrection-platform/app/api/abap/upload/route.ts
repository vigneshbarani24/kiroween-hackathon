import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

// Supported ABAP file extensions
const SUPPORTED_EXTENSIONS = ['.abap', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const isValidExtension = SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
      return NextResponse.json(
        { 
          error: 'Invalid file format',
          message: `Only ${SUPPORTED_EXTENSIONS.join(', ')} files are supported`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString('utf-8');

    // Basic ABAP validation - check for common ABAP keywords
    const abapKeywords = ['REPORT', 'FUNCTION', 'CLASS', 'METHOD', 'DATA', 'FORM', 'PERFORM'];
    const hasABAPKeywords = abapKeywords.some(keyword => 
      content.toUpperCase().includes(keyword)
    );

    if (!hasABAPKeywords) {
      return NextResponse.json(
        { 
          error: 'Invalid ABAP content',
          message: 'File does not appear to contain valid ABAP code'
        },
        { status: 400 }
      );
    }

    // Calculate lines of code
    const linesOfCode = content.split('\n').filter(line => line.trim().length > 0).length;

    // Determine ABAP object type from content
    let objectType = 'UNKNOWN';
    if (content.toUpperCase().includes('REPORT')) objectType = 'REPORT';
    else if (content.toUpperCase().includes('FUNCTION')) objectType = 'FUNCTION';
    else if (content.toUpperCase().includes('CLASS')) objectType = 'CLASS';
    else if (content.toUpperCase().includes('FORM')) objectType = 'FORM';

    // Determine module (simplified - could be enhanced with better parsing)
    let module = 'CUSTOM';
    if (content.includes('VBAK') || content.includes('VBAP')) module = 'SD';
    else if (content.includes('EKKO') || content.includes('EKPO')) module = 'MM';
    else if (content.includes('BKPF') || content.includes('BSEG')) module = 'FI';

    // Store file temporarily
    const uploadDir = join(process.cwd(), 'uploads', 'abap');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = join(uploadDir, `${timestamp}_${safeFileName}`);
    await writeFile(filePath, buffer);

    // Create ABAPObject record in database
    const abapObject = await prisma.aBAPObject.create({
      data: {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        type: objectType,
        module: module,
        content: content,
        linesOfCode: linesOfCode,
        complexity: null, // Will be calculated during analysis
        documentation: null,
        businessLogic: Prisma.JsonNull,
        dependencies: Prisma.JsonNull,
        tables: Prisma.JsonNull,
        embeddingId: null,
        resurrectionId: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ABAP file uploaded successfully',
      object: {
        id: abapObject.id,
        name: abapObject.name,
        type: abapObject.type,
        module: abapObject.module,
        linesOfCode: abapObject.linesOfCode,
        filePath: filePath
      }
    }, { status: 200 });

  } catch (err) {
    console.error('Error uploading ABAP file:', err);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
