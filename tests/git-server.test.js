/**
 * Git MCP Server Test Suite
 *
 * Comprehensive test plan for the Git MCP Server
 * Tests MCP protocol compliance and Git tool functionality
 */

import { spawn } from 'child_process';

// Test configuration
const TEST_REPO_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';
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
 * Test Case 1: MCP Server Startup
 * Expected: Server starts without errors and responds to initialize
 */
async function testMCPServerStartup() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 1: MCP Server Startup');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send initialize request
    setTimeout(() => {
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

      // Wait for response
      setTimeout(() => {
        if (output.includes('git-server') && output.includes('protocolVersion')) {
          logTest('MCP Server Startup', 'PASS', 'Server initialized successfully');
        } else {
          logTest('MCP Server Startup', 'FAIL', 'Server did not respond correctly to initialize');
        }
        server.kill();
        resolve();
      }, 1000);
    }, 500);
  });
}

/**
 * Test Case 2: Tools List
 * Expected: Server returns list of 11 Git tools
 */
async function testToolsList() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 2: Tools List');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize first
    setTimeout(() => {
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

      // Then request tools list
      setTimeout(() => {
        const toolsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        };
        server.stdin.write(JSON.stringify(toolsRequest) + '\n');

        // Check response
        setTimeout(() => {
          const expectedTools = [
            'git_status', 'create_branch', 'switch_branch', 'list_branches',
            'merge_branch', 'create_worktree', 'list_worktrees', 'remove_worktree',
            'commit_changes', 'push_changes', 'pull_changes'
          ];

          let toolsFound = 0;
          expectedTools.forEach(tool => {
            if (output.includes(tool)) toolsFound++;
          });

          if (toolsFound === expectedTools.length) {
            logTest('Tools List', 'PASS', `Found all ${expectedTools.length} Git tools`);
          } else {
            logTest('Tools List', 'FAIL', `Found ${toolsFound}/${expectedTools.length} tools`);
          }
          server.kill();
          resolve();
        }, 1000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 3: Git Status Tool
 * Expected: Returns repository status with current branch info
 */
async function testGitStatusTool() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 3: Git Status Tool');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
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
          if (output.includes('current') && output.includes('not_added') && output.includes('files')) {
            logTest('Git Status Tool', 'PASS', 'Retrieved repository status successfully');
          } else {
            logTest('Git Status Tool', 'FAIL', 'Did not retrieve valid status. Output: ' + output.slice(-500));
          }
          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 4: Create Branch Tool
 * Expected: Creates new branch successfully
 */
async function testCreateBranchTool() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 4: Create Branch Tool');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize and create branch
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

      // Create test branch
      setTimeout(() => {
        const timestamp = Date.now();
        const branchRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'create_branch',
            arguments: { branchName: `test-branch-mcp-${timestamp}` }
          }
        };
        server.stdin.write(JSON.stringify(branchRequest) + '\n');

        // Check response
        setTimeout(() => {
          if (output.includes('created successfully')) {
            logTest('Create Branch Tool', 'PASS', 'Branch created successfully');
          } else {
            logTest('Create Branch Tool', 'FAIL', 'Branch creation failed. Output: ' + output.slice(-500));
          }
          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 5: Worktree Creation Tool
 * Expected: Creates worktree with new branch
 */
async function testWorktreeCreationTool() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 5: Worktree Creation Tool');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize and create worktree
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

      // Create worktree
      setTimeout(() => {
        const timestamp = Date.now();
        const worktreeRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'create_worktree',
            arguments: {
              path: `/tmp/mcp-test-worktree-${timestamp}`,
              branch: `mcp-worktree-branch-${timestamp}`
            }
          }
        };
        server.stdin.write(JSON.stringify(worktreeRequest) + '\n');

        // Check response
        setTimeout(() => {
          const hasWorktreeCreated = output.includes('Worktree created');
          const hasBranchName = output.includes('mcp-worktree-branch-');
          const hasPath = output.includes('mcp-test-worktree-');

          if (hasWorktreeCreated && hasBranchName && hasPath) {
            logTest('Worktree Creation Tool', 'PASS', 'Worktree created successfully');
          } else {
            logTest('Worktree Creation Tool', 'FAIL', `Worktree creation check failed. Created: ${hasWorktreeCreated}, Branch: ${hasBranchName}, Path: ${hasPath}. Output: ${output.slice(-300)}`);
          }
          server.kill();
          resolve();
        }, 3000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 6: Error Handling
 * Expected: Proper error messages for invalid operations
 */
async function testErrorHandling() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 6: Error Handling');

    const server = spawn('node', [SERVER_PATH], {
      cwd: '/Users/rupindersingh/code/Kilo-Code/MCP/git-server',
      env: { ...process.env, GIT_REPO_PATH: '/nonexistent/path' }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize and call git_status with invalid repo
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
          if (output.includes('error') || output.includes('fatal') || output.includes('GitConstructError') || output.includes('Failed to initialize')) {
            logTest('Error Handling', 'PASS', 'Proper error handling for invalid repository');
          } else {
            logTest('Error Handling', 'FAIL', 'Did not handle error properly. Output: ' + output.slice(-500));
          }
          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Generate Test Report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 GIT MCP SERVER TEST REPORT');
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
    console.log('\n⚠️  FAILURES DETECTED - Please fix the issues and rerun the test suite.');
    return false;
  } else {
    console.log('\n🎉 ALL TESTS PASSED - Git MCP Server is ready for production!');
    return true;
  }
}

// Main test execution
async function runTestSuite() {
  console.log('🚀 Starting Git MCP Server Test Suite...\n');

  try {
    await testMCPServerStartup();
    await testToolsList();
    await testGitStatusTool();
    await testCreateBranchTool();
    await testWorktreeCreationTool();
    await testErrorHandling();

    const success = generateTestReport();
    return success;

  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    return false;
  }
}

// Export for use in other test files
export { runTestSuite, testResults };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestSuite();
}