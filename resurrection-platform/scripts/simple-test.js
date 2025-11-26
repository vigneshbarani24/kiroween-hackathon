/**
 * Simple manual test to verify the end-to-end workflow
 * Run this after starting the dev server with: npm run dev
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000';
const ABAP_FILE_PATH = path.join(__dirname, '..', '..', 'src', 'abap-samples', 'sales-order-processing.abap');

async function test() {
  console.log('\n🚀 Starting End-to-End Test\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`ABAP File: ${ABAP_FILE_PATH}\n`);

  try {
    // Step 1: Upload ABAP file
    console.log('Step 1: Uploading ABAP file...');
    const fileContent = fs.readFileSync(ABAP_FILE_PATH);
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: 'sales-order-processing.abap',
      contentType: 'text/plain'
    });

    const fetch = require('node-fetch');
    const uploadResponse = await fetch(`${API_BASE_URL}/api/abap/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Upload failed: ${JSON.stringify(error)}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log(`   Object ID: ${uploadData.object.id}`);
    console.log(`   Name: ${uploadData.object.name}`);
    console.log(`   LOC: ${uploadData.object.linesOfCode}\n`);

    // Step 2: Create resurrection
    console.log('Step 2: Creating resurrection...');
    const createResponse = await fetch(`${API_BASE_URL}/api/resurrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test-sales-order',
        description: 'Test resurrection',
        module: 'SD',
        abapObjectIds: [uploadData.object.id]
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Resurrection creation failed: ${JSON.stringify(error)}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Resurrection created!');
    console.log(`   ID: ${createData.resurrection.id}`);
    console.log(`   Name: ${createData.resurrection.name}`);
    console.log(`   Status: ${createData.resurrection.status}\n`);

    // Step 3: Start transformation
    console.log('Step 3: Starting transformation workflow...');
    const startResponse = await fetch(`${API_BASE_URL}/api/resurrections/${createData.resurrection.id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useKiroSpec: false })
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(`Transformation start failed: ${JSON.stringify(error)}`);
    }

    const startData = await startResponse.json();
    console.log('✅ Transformation started!');
    console.log(`   Status: ${startData.resurrection.status}`);
    console.log(`   Estimated duration: ${startData.resurrection.estimatedDuration}\n`);

    // Step 4: Poll for completion
    console.log('Step 4: Waiting for completion...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`${API_BASE_URL}/api/resurrections/${createData.resurrection.id}/status`);
      
      if (!statusResponse.ok) {
        console.log(`   ⚠️  Status check failed, retrying...`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`   📍 Status: ${statusData.resurrection.status} (${statusData.resurrection.progressPercentage}%)`);

      if (statusData.resurrection.status === 'COMPLETED') {
        console.log('\n✅ Workflow completed successfully!');
        console.log(`   GitHub URL: ${statusData.resurrection.githubUrl || 'N/A'}`);
        console.log(`   BAS URL: ${statusData.resurrection.basUrl || 'N/A'}`);
        console.log(`   Quality Score: ${statusData.resurrection.qualityScore || 'N/A'}`);
        break;
      } else if (statusData.resurrection.status === 'FAILED') {
        throw new Error('Workflow failed');
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Workflow timeout');
    }

    console.log('\n🎉 All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
