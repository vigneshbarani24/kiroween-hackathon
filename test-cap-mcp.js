#!/usr/bin/env node
/**
 * Test SAP CAP MCP Server
 * This will start the server and try to discover what tools it provides
 */

const { spawn } = require('child_process');

console.log('Testing SAP CAP MCP Server...');
console.log('='.repeat(60));

// Start the MCP server
const server = spawn('npx', ['-y', '@cap-js/mcp-server'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('STDERR:', data.toString());
});

// Send MCP initialization request
setTimeout(() => {
  console.log('\nSending initialization request...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Send tools/list request
setTimeout(() => {
  console.log('\nSending tools/list request...');
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 2000);

// Cleanup after 5 seconds
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('Test complete. Killing server...');
  server.kill();
  
  if (output) {
    console.log('\n✅ SAP CAP MCP Server responded!');
    console.log('Output:', output);
  } else {
    console.log('\n❌ No response from SAP CAP MCP Server');
  }
  
  if (errorOutput) {
    console.log('\nErrors:', errorOutput);
  }
  
  process.exit(0);
}, 5000);

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
