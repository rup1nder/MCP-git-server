/**
 * Direct Git Status Test - Test git-server git_status tool directly
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';
const TEST_REPO_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';

async function testDirectGitStatus() {
  return new Promise((resolve) => {
    console.log('🧪 Testing git-server git_status tool directly...\n');

    const startTime = performance.now();

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';
    let requestSent = false;
    let responseReceived = false;

    server.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      // Send initialize request first
      if (!requestSent && output.includes('running on stdio')) {
        console.log('📤 Sending initialize request...');
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'direct-test', version: '1.0.0' }
          }
        };
        server.stdin.write(JSON.stringify(initRequest) + '\n');
        requestSent = true;
      }

      // Send git_status request after initialize response
      if (requestSent && !responseReceived && output.includes('"id": 1')) {
        console.log('📤 Sending git_status request...');
        const statusRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'git_status',
            arguments: {}
          }
        };
        server.stdin.write(JSON.stringify(statusRequest) + '\n');
        responseReceived = true;
      }

      // Check for git_status response
      if (output.includes('"id": 2')) {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        console.log(`\n✅ Git Status Response Received!`);
        console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}ms`);

        // Extract the response
        const responseStart = output.lastIndexOf('{"jsonrpc"');
        if (responseStart !== -1) {
          const responseText = output.substring(responseStart);
          console.log('\n📄 Response:');
          console.log(responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
        }

        server.kill();
        resolve(totalTime);
      }
    });

    server.stderr.on('data', (data) => {
      console.log('📋 Server stderr:', data.toString());
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('\n⏰ Test timed out after 5 seconds');
      console.log('📄 Final output:');
      console.log(output.slice(-1000));
      server.kill();
      resolve(null);
    }, 5000);
  });
}

// Run the test
testDirectGitStatus().then((time) => {
  if (time) {
    console.log(`\n🎯 Direct git-server git_status test completed in ${time.toFixed(2)}ms`);
  } else {
    console.log('\n❌ Test failed or timed out');
  }
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});