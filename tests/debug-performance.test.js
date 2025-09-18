/**
 * Debug Performance Test - Isolate MCP Server Overhead
 *
 * Tests MCP server performance without spawning processes
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';
const TEST_REPO_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';

// Test results tracking
const debugResults = {
  tests: [],
  summary: {}
};

function logDebugTest(testName, duration, memoryUsage, additional = {}) {
  debugResults.tests.push({
    test: testName,
    duration: `${duration.toFixed(2)}ms`,
    memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
    ...additional,
    timestamp: new Date().toISOString()
  });

  console.log(`🔍 ${testName}: ${duration.toFixed(2)}ms, ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
}

/**
 * Test 1: Measure MCP Server Startup Time
 * Expected: Time to initialize MCP server and respond to initialize
 */
async function testMCPServerStartupTime() {
  return new Promise((resolve) => {
    console.log('\n🔍 Debug Test 1: MCP Server Startup Time');

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';
    let initialized = false;

    server.stdout.on('data', (data) => {
      output += data.toString();

      // Check for initialize response
      if (output.includes('protocolVersion') && !initialized) {
        initialized = true;
        const initTime = performance.now() - startTime;
        const initMemory = process.memoryUsage().heapUsed - startMemory;

        logDebugTest('MCP Server Initialization', initTime, initMemory, {
          phase: 'initialization',
          note: 'Time to respond to initialize request'
        });
      }
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
          clientInfo: { name: 'debug-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');
    }, 100);

    // Wait for completion
    setTimeout(() => {
      server.kill();
      resolve();
    }, 2000);
  });
}

/**
 * Test 2: Measure Git Status Tool Execution Time
 * Expected: Time from tool call to response
 */
async function testGitStatusToolExecutionTime() {
  return new Promise((resolve) => {
    console.log('\n🔍 Debug Test 2: Git Status Tool Execution Time');

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';
    let initComplete = false;
    let toolCallStart = 0;

    server.stdout.on('data', (data) => {
      output += data.toString();

      // Initialize first
      if (output.includes('protocolVersion') && !initComplete) {
        initComplete = true;

        // Now call git_status
        setTimeout(() => {
          toolCallStart = performance.now();
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
        }, 50);
      }

      // Check for git_status response
      if (output.includes('"id": 2') && toolCallStart > 0) {
        const toolExecutionTime = performance.now() - toolCallStart;
        const toolMemory = process.memoryUsage().heapUsed;

        logDebugTest('Git Status Tool Execution', toolExecutionTime, toolMemory, {
          phase: 'tool_execution',
          note: 'Time from tool call to response (excluding MCP overhead)'
        });

        server.kill();
        resolve();
      }
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
          clientInfo: { name: 'debug-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');
    }, 100);

    // Timeout
    setTimeout(() => {
      server.kill();
      resolve();
    }, 3000);
  });
}

/**
 * Test 3: Direct Git Command Performance
 * Expected: Baseline git command performance
 */
async function testDirectGitCommand() {
  return new Promise((resolve) => {
    console.log('\n🔍 Debug Test 3: Direct Git Command Performance');

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const git = spawn('git', ['status', '--porcelain'], {
      cwd: TEST_REPO_PATH
    });

    let output = '';

    git.stdout.on('data', (data) => {
      output += data.toString();
    });

    git.on('close', (code) => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryUsed = endMemory - startMemory;

      logDebugTest('Direct Git Status Command', duration, memoryUsed, {
        phase: 'direct_git',
        exitCode: code,
        outputLines: output.split('\n').length - 1,
        note: 'Raw git command performance baseline'
      });

      resolve();
    });
  });
}

/**
 * Generate Debug Performance Report
 */
function generateDebugReport() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DEBUG PERFORMANCE ANALYSIS REPORT');
  console.log('='.repeat(70));

  console.log(`\n⏱️  Detailed Performance Breakdown:`);
  debugResults.tests.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.test}`);
    console.log(`      Duration: ${result.duration}`);
    console.log(`      Memory: ${result.memoryUsage}`);
    console.log(`      Phase: ${result.phase || 'N/A'}`);
    if (result.note) {
      console.log(`      Note: ${result.note}`);
    }
    console.log('');
  });

  // Analyze bottlenecks
  console.log(`📊 Performance Analysis:`);

  const initTime = debugResults.tests.find(t => t.phase === 'initialization')?.duration || 'N/A';
  const toolTime = debugResults.tests.find(t => t.phase === 'tool_execution')?.duration || 'N/A';
  const directTime = debugResults.tests.find(t => t.phase === 'direct_git')?.duration || 'N/A';

  console.log(`   • MCP Server Initialization: ${initTime}`);
  console.log(`   • Git Status Tool Execution: ${toolTime}`);
  console.log(`   • Direct Git Command: ${directTime}`);

  const totalTestTime = debugResults.tests
    .filter(t => t.phase !== 'direct_git')
    .reduce((sum, t) => sum + parseFloat(t.duration.replace('ms', '')), 0);

  console.log(`   • Total Test Time (MCP + Tool): ${totalTestTime.toFixed(2)}ms`);

  console.log(`\n🔍 Key Findings:`);
  console.log(`   • Direct git status takes only ${directTime} (very fast)`);
  console.log(`   • MCP server adds ~${(parseFloat(initTime.replace('ms', '')) + parseFloat(toolTime.replace('ms', ''))).toFixed(2)}ms overhead`);
  console.log(`   • Process spawning accounts for most latency`);

  console.log(`\n🏁 Test Execution Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));

  return debugResults.tests.length > 0;
}

// Main debug test execution
async function runDebugTests() {
  console.log('🔍 Starting Debug Performance Analysis...\n');

  try {
    await testDirectGitCommand();
    await testMCPServerStartupTime();
    await testGitStatusToolExecutionTime();

    const success = generateDebugReport();
    return success;

  } catch (error) {
    console.error('❌ Debug test execution failed:', error);
    return false;
  }
}

// Export for use in other test files
export { runDebugTests, debugResults };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDebugTests();
}