/**
 * Test the ABAP Analyzer MCP Server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testMCPServer() {
  console.log('🧪 Testing ABAP Analyzer MCP Server\n');

  // Read sample ABAP code
  const abapPath = path.join(__dirname, 'src', 'abap-samples', 'sales-order-processing.abap');
  const abapCode = fs.readFileSync(abapPath, 'utf-8');

  // Start MCP server
  console.log('Starting MCP server...');
  const mcpServer = spawn('python', ['.kiro/mcp/abap-analyzer.py']);

  let responseReceived = false;

  mcpServer.stdout.on('data', (data) => {
    const response = data.toString();
    console.log('\n📥 MCP Response:');
    console.log(response);
    
    try {
      const parsed = JSON.parse(response);
      if (parsed.result && parsed.result.data) {
        console.log('\n✅ MCP Server Working!');
        console.log('\nAnalysis Results:');
        console.log('- Module:', parsed.result.data.metadata.module);
        console.log('- Complexity:', parsed.result.data.metadata.complexity);
        console.log('- Business Logic:', parsed.result.data.businessLogic);
        console.log('- Tables:', parsed.result.data.tables);
        console.log('- Patterns:', parsed.result.data.patterns);
        responseReceived = true;
      }
    } catch (e) {
      // Not JSON, might be startup message
    }
  });

  mcpServer.stderr.on('data', (data) => {
    console.log('📝 MCP Server:', data.toString().trim());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send request
  console.log('\n📤 Sending analysis request...');
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'analyzeCode',
    params: {
      code: abapCode.substring(0, 1000) // Send first 1000 chars
    }
  };

  mcpServer.stdin.write(JSON.stringify(request) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (!responseReceived) {
    console.log('\n❌ No response received from MCP server');
  }

  // Cleanup
  mcpServer.kill();
  console.log('\n✅ Test complete');
}

testMCPServer().catch(console.error);
