/**
 * Test Configurable Cleanup Functionality
 * This test actually creates branches and worktrees to verify cleanup works
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const SERVER_PATH = path.join(process.cwd(), 'git-server.js');
const TEST_REPO_PATH = process.cwd();

// Test configuration
const CLEANUP_AFTER_TESTS = process.env.SECURITY_TEST_CLEANUP !== 'false';
const DEBUG_MODE = process.env.SECURITY_TEST_DEBUG === 'true';

function generateTestId() {
  return `cleanup-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function testServerRequest(request) {
  return new Promise((resolve) => {
    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
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

    // Initialize server
    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'cleanup-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Send test request
      setTimeout(() => {
        server.stdin.write(JSON.stringify(request) + '\n');

        // Wait for response
        setTimeout(() => {
          server.kill();
          resolve({ output, errorOutput });
        }, 2000);
      }, 500);
    }, 500);
  });
}

async function testCleanupFunctionality() {
  console.log('🧹 Testing Configurable Cleanup Functionality\n');

  const testId = generateTestId();
  console.log(`Test ID: ${testId}`);
  console.log(`Cleanup enabled: ${CLEANUP_AFTER_TESTS}`);
  console.log(`Debug mode: ${DEBUG_MODE}\n`);

  // Create test artifacts
  console.log('📝 Creating test artifacts...');

  // 1. Create a test branch
  const branchRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'create_branch',
      arguments: {
        branchName: `${testId}-branch`
      }
    }
  };

  console.log(`Creating branch: ${testId}-branch`);
  const branchResult = await testServerRequest(branchRequest);
  console.log(`Branch creation result: ${branchResult.output.includes('Branch created successfully') ? '✅' : '❌'}`);

  // 2. Create a test worktree
  const worktreeRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'create_worktree',
      arguments: {
        path: `tmp/${testId}-worktree`,
        branch: `${testId}-worktree-branch`
      }
    }
  };

  console.log(`Creating worktree: tmp/${testId}-worktree`);
  const worktreeResult = await testServerRequest(worktreeRequest);
  console.log(`Worktree creation result: ${worktreeResult.output.includes('Worktree created') ? '✅' : '❌'}`);

  // Check what was created
  console.log('\n🔍 Checking created artifacts...');

  const gitBranch = spawn('git', ['branch', '-a'], { cwd: TEST_REPO_PATH });
  let branchOutput = '';
  gitBranch.stdout.on('data', (data) => {
    branchOutput += data.toString();
  });

  await new Promise((resolve) => {
    gitBranch.on('close', () => {
      console.log('Current branches:');
      console.log(branchOutput);
      resolve();
    });
  });

  const gitWorktree = spawn('git', ['worktree', 'list'], { cwd: TEST_REPO_PATH });
  let worktreeOutput = '';
  gitWorktree.stdout.on('data', (data) => {
    worktreeOutput += data.toString();
  });

  await new Promise((resolve) => {
    gitWorktree.on('close', () => {
      console.log('Current worktrees:');
      console.log(worktreeOutput);
      resolve();
    });
  });

  // Test cleanup logic
  console.log('\n🧹 Testing cleanup logic...');

  if (CLEANUP_AFTER_TESTS) {
    console.log('✅ Cleanup enabled - cleaning up test artifacts...');

    // Clean up branches
    const branchesToClean = branchOutput.split('\n')
      .map(line => line.trim().replace('* ', ''))
      .filter(branch => branch.includes(testId));

    for (const branch of branchesToClean) {
      if (branch && branch !== 'main') {
        console.log(`Deleting branch: ${branch}`);
        const deleteBranch = spawn('git', ['branch', '-D', branch], { cwd: TEST_REPO_PATH });
        await new Promise((resolve) => {
          deleteBranch.on('close', (code) => {
            console.log(`Branch deletion exit code: ${code}`);
            resolve();
          });
        });
      }
    }

    // Clean up worktrees
    const worktreesToClean = worktreeOutput.split('\n')
      .filter(line => line.includes(testId) && !line.includes('[main]'))
      .map(line => line.split(' ')[0]);

    for (const worktreePath of worktreesToClean) {
      if (worktreePath) {
        console.log(`Removing worktree: ${worktreePath}`);
        const removeWorktree = spawn('git', ['worktree', 'remove', worktreePath], { cwd: TEST_REPO_PATH });
        await new Promise((resolve) => {
          removeWorktree.on('close', (code) => {
            console.log(`Worktree removal exit code: ${code}`);
            resolve();
          });
        });
      }
    }

  } else {
    console.log('🔍 Cleanup disabled - preserving artifacts for debugging');
    if (DEBUG_MODE) {
      console.log('🐛 Debug mode enabled - detailed logging active');
    }
  }

  // Final check
  console.log('\n📋 Final repository state:');

  const finalBranch = spawn('git', ['branch', '-a'], { cwd: TEST_REPO_PATH });
  let finalBranchOutput = '';
  finalBranch.stdout.on('data', (data) => {
    finalBranchOutput += data.toString();
  });

  await new Promise((resolve) => {
    finalBranch.on('close', () => {
      console.log('Final branches:');
      console.log(finalBranchOutput);
      resolve();
    });
  });

  const finalWorktree = spawn('git', ['worktree', 'list'], { cwd: TEST_REPO_PATH });
  let finalWorktreeOutput = '';
  finalWorktree.stdout.on('data', (data) => {
    finalWorktreeOutput += data.toString();
  });

  await new Promise((resolve) => {
    finalWorktree.on('close', () => {
      console.log('Final worktrees:');
      console.log(finalWorktreeOutput);
      resolve();
    });
  });

  console.log('\n🎉 Cleanup test completed!');
  console.log(`Cleanup mode: ${CLEANUP_AFTER_TESTS ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Debug mode: ${DEBUG_MODE ? 'ENABLED' : 'DISABLED'}`);
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testCleanupFunctionality().catch(console.error);
}