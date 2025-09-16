#!/usr/bin/env node
import { spawn } from 'child_process';

// Test configuration for current repository
const CURRENT_REPO_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';
const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  results: []
};

function logTest(testName, status, message = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  testResults.results.push({
    test: testName,
    status,
    message,
    timestamp: new Date().toISOString()
  });

  console.log(`[${status}] ${testName}${message ? ': ' + message : ''}`);
}

/**
 * Test Case: Git Status Tool with Current Repository
 * Expected: Returns status for the current workspace repository
 */
async function testGitStatusCurrentRepo() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case: Git Status Tool - Current Repository');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: CURRENT_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      console.log('Server stderr:', data.toString());
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
        server.stdin.write(JSON.stringify(statusRequest) + '\n');

        // Check response
        setTimeout(() => {
          console.log('MCP Server Output:');
          console.log(output);

          // Check if the output contains files from the current repository
          const hasModifiedFiles = output.includes('build/index.js') || output.includes('git-server.js');
          const hasDeletedFiles = output.includes('git-server.test.js') || output.includes('test-server.js');
          const hasUntrackedFiles = output.includes('.gitignore') || output.includes('README.md');

          if (hasModifiedFiles && hasDeletedFiles && hasUntrackedFiles) {
            logTest('Git Status Tool - Current Repository', 'PASS', 'Retrieved correct status for current repository');
          } else {
            logTest('Git Status Tool - Current Repository', 'FAIL', `Missing expected files. Modified: ${hasModifiedFiles}, Deleted: ${hasDeletedFiles}, Untracked: ${hasUntrackedFiles}`);
          }
          server.kill();
          resolve();
        }, 3000);
      }, 500);
    }, 500);
  });
}

// Main test execution
async function runCurrentRepoTest() {
  console.log('🚀 Testing Git MCP Server with Current Repository...\n');

  try {
    await testGitStatusCurrentRepo();

    console.log('\n' + '='.repeat(60));
    console.log('📊 CURRENT REPO TEST REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Test Summary:`);
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed}`);
    console.log(`   Failed: ${testResults.failed}`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    console.log(`\n📋 Detailed Results:`);
    testResults.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.test}`);
      if (result.message) {
        console.log(`      ${result.message}`);
      }
    });

    console.log(`\n🏁 Test Execution Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    if (testResults.failed > 0) {
      console.log('\n⚠️  FAILURES DETECTED - Repository path issue confirmed.');
      return false;
    } else {
      console.log('\n🎉 TEST PASSED - MCP working correctly with current repository!');
      return true;
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCurrentRepoTest();
}

export { runCurrentRepoTest, testResults };