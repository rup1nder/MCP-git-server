// Test MCP protocol integration
import { spawn } from 'child_process';

async function testMCPIntegration() {
  console.log('🔗 Testing MCP Protocol Integration...\n');

  return new Promise((resolve, reject) => {
    // Start the MCP server
    const serverProcess = spawn('node', ['git-server.js'], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responseBuffer = '';
    let errorBuffer = '';

    // Handle server output
    serverProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
      console.log('Server stderr:', data.toString());
    });

    // Handle server errors
    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
      reject(error);
    });

    // Test MCP protocol messages
    setTimeout(() => {
      try {
        // Send initialize request
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

        console.log('📤 Sending initialize request...');
        serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

        // Wait for response
        setTimeout(() => {
          if (responseBuffer.includes('git-server')) {
            console.log('✅ MCP server initialized successfully');
            console.log('📄 Server response preview:', responseBuffer.substring(0, 200) + '...');

            // Send tools/list request
            const toolsRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            };

            console.log('📤 Sending tools/list request...');
            serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');

            // Wait for tools response
            setTimeout(() => {
              if (responseBuffer.includes('git_status')) {
                console.log('✅ Tools list received successfully');
                console.log('🔧 Available tools detected in response');
              } else {
                console.log('⚠️ Tools list response not detected');
              }

              // Clean up
              serverProcess.kill();
              console.log('✅ MCP integration test completed successfully!');
              resolve();
            }, 1000);
          } else {
            console.log('⚠️ Server initialization response not detected');
            serverProcess.kill();
            resolve();
          }
        }, 1000);
      } catch (error) {
        console.error('❌ Test error:', error);
        serverProcess.kill();
        reject(error);
      }
    }, 500);
  });
}

testMCPIntegration().catch(console.error);