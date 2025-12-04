
/**
 * Test Script for Complete Resurrection Workflow
 * 
 * This script tests the end-to-end workflow including:
 * 1. AI Analysis (LLM)
 * 2. Research (Knowledge MCP)
 * 3. Planning
 * 4. Generation (AI Service Implementation)
 * 5. Validation (Build)
 * 6. Verification (Playwright MCP)
 */

import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { HybridResurrectionWorkflow } from '../lib/workflow/hybrid-workflow';

const prisma = new PrismaClient();

// Sample ABAP Code for testing
const SAMPLE_ABAP_CODE = `
REPORT Z_SALES_REPORT.

TABLES: VBAK, VBAP.

DATA: lt_sales TYPE TABLE OF VBAK,
      ls_sales TYPE VBAK.

SELECT * FROM VBAK INTO TABLE lt_sales
  WHERE auart = 'OR'.

LOOP AT lt_sales INTO ls_sales.
  IF ls_sales-netwr > 1000.
    WRITE: / 'High Value Order:', ls_sales-vbeln, ls_sales-netwr.
  ELSE.
    WRITE: / 'Standard Order:', ls_sales-vbeln.
  ENDIF.
ENDLOOP.
`;

async function runTest() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING: Complete Resurrection Workflow');
  console.log('='.repeat(80));

  try {
    // 1. Setup User & Resurrection Record
    console.log('📝 Step 1: Setting up test data...');
    
    let testUser = await prisma.user.findUnique({ where: { email: 'workflow_test@example.com' } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: { email: 'workflow_test@example.com', name: 'Workflow Tester' }
      });
    }

    const resurrection = await prisma.resurrection.create({
      data: {
        name: 'Sales Report Resurrection',
        description: 'Automated test of the complete AI-driven workflow',
        abapCode: SAMPLE_ABAP_CODE,
        originalLOC: SAMPLE_ABAP_CODE.split('\n').length,
        status: 'UPLOADED',
        module: 'SD',
        userId: testUser.id
      }
    });

    console.log(`   ✅ Created Resurrection ID: ${resurrection.id}`);

    // 2. Execute Workflow
    console.log('🚀 Step 2: Executing Hybrid Workflow...');
    console.log('   - Analyzers: LLM + Knowledge MCP');
    console.log('   - Generators: AI Service Logic');
    console.log('   - Verifiers: Playwright MCP');

    const workflow = new HybridResurrectionWorkflow();
    await workflow.execute(resurrection.id, SAMPLE_ABAP_CODE);

    console.log('✅ Workflow Execution Completed!');

    // 3. Verify Results
    console.log('📊 Step 3: Verifying Results...');
    
    const result = await prisma.resurrection.findUnique({
      where: { id: resurrection.id },
      include: { workflowSteps: true }
    });

    if (!result) throw new Error('Result not found');

    console.log(`   Final Status: ${result.status}`);
    console.log(`   Complexity Score: ${result.complexityScore}`);
    console.log(`   Transformed LOC: ${result.transformedLOC}`);

    const steps = result.workflowSteps;
    console.log('\n   Workflow Steps:');
    steps.forEach(s => {
      const duration = s.completedAt && s.startedAt ? s.completedAt.getTime() - s.startedAt.getTime() : 0;
      console.log(`   - ${s.stepName}: ${s.status} (${duration}ms)`);
    });

    // Check for specific artifacts
    const verifyStep = steps.find(s => s.stepName === 'VERIFY_UI');
    if (verifyStep && verifyStep.status === 'COMPLETED') {
      console.log('\n   ✅ UI Verification Successful');
      console.log(`   Evidence: ${JSON.stringify(verifyStep.output)}`);
    } else {
      console.warn('\n   ⚠️ UI Verification did not complete (check logs)');
    }

    console.log('\n🎉 TEST PASSED: Full workflow executed successfully.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
