#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test configuration
const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';
const CURRENT_WORKSPACE = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';

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
 * Test Case 1: Default Repository Path
 * Expected: MCP server uses current working directory when no GIT_REPO_PATH is set
 */
async function testDefaultRepoPath() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 1: Default Repository Path');

    const server = spawn('node', [SERVER_PATH], {
      cwd: CURRENT_WORKSPACE,
      env: { ...process.env } // No GIT_REPO_PATH set
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

        setTimeout(() => {
          // Check if the output contains files from the current workspace
          const hasCurrentWorkspaceFiles = output.includes('git-server.js') &&
                                         output.includes('package.json') &&
                                         output.includes('README.md');

          if (hasCurrentWorkspaceFiles) {
            logTest('Default Repository Path', 'PASS', 'MCP server correctly uses current working directory');
          } else {
            logTest('Default Repository Path', 'FAIL', 'MCP server did not use current working directory');
          }
          server.kill();
          resolve();
        }, 3000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 2: Environment Variable Override
 * Expected: GIT_REPO_PATH environment variable still works for overriding
 */
async function testEnvOverride() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 2: Environment Variable Override');

    const server = spawn('node', [SERVER_PATH], {
      cwd: CURRENT_WORKSPACE,
      env: { ...process.env, GIT_REPO_PATH: '/tmp' } // Override with /tmp
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

        setTimeout(() => {
          // Should get an error since /tmp is not a git repository
          const hasError = output.includes('error') || output.includes('fatal') ||
                          output.includes('Failed to initialize') || output.includes('not a git repository');

          if (hasError) {
            logTest('Environment Variable Override', 'PASS', 'GIT_REPO_PATH override works correctly');
          } else {
            logTest('Environment Variable Override', 'FAIL', 'GIT_REPO_PATH override did not work as expected');
          }
          server.kill();
          resolve();
        }, 3000);
      }, 500);
    }, 500);
  });
}

/**
 * Test Case 3: Git Status Content Validation
 * Expected: MCP output matches actual git status for current repository
 */
async function testGitStatusContent() {
  return new Promise((resolve) => {
    console.log('\n🧪 Test Case 3: Git Status Content Validation');

    const server = spawn('node', [SERVER_PATH], {
      cwd: CURRENT_WORKSPACE,
      env: { ...process.env } // No GIT_REPO_PATH set
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize and call git_status
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

        setTimeout(() => {
          // Expected files from git status
          const expectedModified = ['build/index.js', 'git-server.js', 'package.json', 'src/index.ts'];
          const expectedDeleted = ['git-server.test.js', 'test-server.js'];
          const expectedUntracked = ['.gitignore', 'README.md', 'TEST_PLAN.md'];

          let modifiedCount = 0;
          let deletedCount = 0;
          let untrackedCount = 0;

          expectedModified.forEach(file => {
            if (output.includes(file)) modifiedCount++;
          });

          expectedDeleted.forEach(file => {
            if (output.includes(file)) deletedCount++;
          });

          expectedUntracked.forEach(file => {
            if (output.includes(file)) untrackedCount++;
          });

          const allFilesFound = modifiedCount === expectedModified.length &&
                               deletedCount === expectedDeleted.length &&
                               untrackedCount === expectedUntracked.length;

          if (allFilesFound) {
            logTest('Git Status Content Validation', 'PASS', `Found all expected files: ${modifiedCount} modified, ${deletedCount} deleted, ${untrackedCount} untracked`);
          } else {
            logTest('Git Status Content Validation', 'FAIL', `Missing files - Modified: ${modifiedCount}/${expectedModified.length}, Deleted: ${deletedCount}/${expectedDeleted.length}, Untracked: ${untrackedCount}/${expectedUntracked.length}`);
          }
          server.kill();
          resolve();
        }, 3000);
      }, 500);
    }, 500);
  });
}

// Main test execution
async function runRepoPathTests() {
  console.log('🚀 Testing Git MCP Server Repository Path Fix...\n');

  try {
    await testDefaultRepoPath();
    await testEnvOverride();
    await testGitStatusContent();

    console.log('\n' + '='.repeat(60));
    console.log('📊 REPOSITORY PATH FIX TEST REPORT');
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
      console.log('\n⚠️  SOME TESTS FAILED - Repository path fix may need additional work.');
      return false;
    } else {
      console.log('\n🎉 ALL TESTS PASSED - Repository path fix is working correctly!');
      return true;
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRepoPathTests();
}

export { runRepoPathTests, testResults };