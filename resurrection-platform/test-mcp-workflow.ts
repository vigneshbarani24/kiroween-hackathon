#!/usr/bin/env node

/**
 * Test MCP + LLM Workflow
 * 
 * Quick test script to verify MCP servers can start and connect
 */

import { MCPProcessManager } from './lib/mcp/mcp-process-manager';
import { validateResurrectionEnv } from './lib/config/env-validator';
import { join } from 'path';

async function testMCPWorkflow() {
  console.log('🧪 Testing MCP + LLM Workflow\n');

  // Step 1: Validate environment variables
  console.log('Step 1: Validating environment variables...');
  try {
    validateResurrectionEnv();
    console.log('✅ Environment variables validated\n');
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n💡 Please configure your .env.local file with required API keys');
    process.exit(1);
  }

  // Step 2: Start MCP servers
  console.log('Step 2: Starting MCP servers...');
  const processManager = new MCPProcessManager();

  try {
    // Start ABAP Analyzer
    console.log('  Starting ABAP Analyzer MCP...');
    await processManager.startServer({
      name: 'abap-analyzer',
      command: 'python',
      args: [join(process.cwd(), '..', '.kiro', 'mcp', 'abap-analyzer.py')],
      env: { PYTHONUNBUFFERED: '1' },
      autoRestart: false
    });

    // Start SAP CAP MCP
    console.log('  Starting SAP CAP MCP...');
    await processManager.startServer({
      name: 'sap-cap',
      command: 'npx',
      args: ['-y', '@cap-js/mcp-server'],
      env: { NODE_ENV: 'production' },
      autoRestart: false
    });

    // Wait for servers to be ready
    console.log('  Waiting for servers to be ready...');
    const ready = await processManager.waitForAll(15000);

    if (!ready) {
      throw new Error('MCP servers failed to start within timeout');
    }

    console.log('✅ MCP servers started successfully\n');

    // Step 3: Check server status
    console.log('Step 3: Checking server status...');
    const status = processManager.getAllStatus();
    
    for (const server of status) {
      const icon = server.running ? '✅' : '❌';
      console.log(`  ${icon} ${server.name}: ${server.running ? 'Running' : 'Stopped'} (PID: ${server.pid || 'N/A'})`);
    }

    console.log('\n✅ All tests passed!');
    console.log('\n🎉 Your MCP + LLM workflow is ready for the hackathon!\n');

    // Cleanup
    console.log('Cleaning up...');
    await processManager.stopAll();
    console.log('✅ Cleanup complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error instanceof Error ? error.message : error);
    
    // Cleanup on error
    await processManager.stopAll();
    process.exit(1);
  }
}

// Run tests
testMCPWorkflow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
