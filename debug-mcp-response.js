// Debug script to see actual MCP response format
import { spawn } from 'child_process';

const TEST_REPO_PATH = '/Users/rupindersingh/code/encryptdecrypt2';
const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';

async function debugMCPResponse() {
  return new Promise((resolve) => {
    console.log('🔍 Debugging MCP Response Format...\n');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📨 Raw output received:', data.toString());
    });

    server.stderr.on('data', (data) => {
      console.log('⚠️ Server stderr:', data.toString());
    });

    // Initialize and call git_status
    setTimeout(() => {
      // Initialize
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };
      console.log('📤 Sending initialize request...');
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Call git_status
      setTimeout(() => {
        const statusRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'git_status',
            arguments: {}
          }
        };
        console.log('📤 Sending git_status request...');
        server.stdin.write(JSON.stringify(statusRequest) + '\n');

        // Check response
        setTimeout(() => {
          console.log('\n📊 Final output analysis:');
          console.log('Contains "current":', output.includes('current'));
          console.log('Contains "master":', output.includes('master'));
          console.log('Contains "error":', output.includes('error'));
          console.log('Contains "result":', output.includes('result'));

          console.log('\n📄 Full output:');
          console.log(output);

          server.kill();
          resolve();
        }, 2000);
      }, 1000);
    }, 500);
  });
}

debugMCPResponse();