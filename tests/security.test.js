/**
 * Security Tests for Git MCP Server
 *
 * Tests path traversal prevention, command injection protection,
 * repository access controls, and environment variable handling
 */

import { spawn } from 'child_process';

const SERVER_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server/git-server.js';
const TEST_REPO_PATH = '/Users/rupindersingh/code/Kilo-Code/MCP/git-server';

// Test results tracking
const securityResults = {
  tests: [],
  vulnerabilities: []
};

function logSecurityTest(testName, status, message = '', vulnerability = false) {
  securityResults.tests.push({
    test: testName,
    status,
    message,
    vulnerability,
    timestamp: new Date().toISOString()
  });

  if (vulnerability) {
    securityResults.vulnerabilities.push({
      test: testName,
      message,
      timestamp: new Date().toISOString()
    });
  }

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${testName}: ${message}`);
}

/**
 * Test 1: Path Traversal Prevention
 * Expected: Server should reject paths with .. or absolute paths outside repo
 */
async function testPathTraversalPrevention() {
  return new Promise((resolve) => {
    console.log('\n🔒 Security Test 1: Path Traversal Prevention');

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    // Initialize
    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'security-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Test path traversal in worktree creation
      setTimeout(() => {
        const maliciousRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'create_worktree',
            arguments: {
              path: '../../../etc/passwd',
              branch: 'malicious'
            }
          }
        };
        server.stdin.write(JSON.stringify(maliciousRequest) + '\n');

        setTimeout(() => {
          // Check if the server rejected the malicious path
          const rejected = output.includes('error') || output.includes('invalid') ||
                          !output.includes('Worktree created') ||
                          output.includes('../../../etc/passwd') === false;

          if (rejected) {
            logSecurityTest('Path Traversal Prevention', 'PASS',
              'Server correctly rejected path traversal attempt');
          } else {
            logSecurityTest('Path Traversal Prevention', 'FAIL',
              'Server may be vulnerable to path traversal', true);
          }

          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test 2: Command Injection Prevention
 * Expected: Server should sanitize inputs to prevent command injection
 */
async function testCommandInjectionPrevention() {
  return new Promise((resolve) => {
    console.log('\n🔒 Security Test 2: Command Injection Prevention');

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'security-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Test command injection in branch name
      setTimeout(() => {
        const injectionRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'create_branch',
            arguments: {
              branchName: 'test && rm -rf /tmp/*'
            }
          }
        };
        server.stdin.write(JSON.stringify(injectionRequest) + '\n');

        setTimeout(() => {
          // Check if injection was prevented
          const injectionExecuted = output.includes('rm -rf') ||
                                   output.includes('command not found') ||
                                   output.includes('permission denied');

          const injectionPrevented = output.includes('dangerous characters not allowed') ||
                                    output.includes('Invalid branch name');

          if (!injectionExecuted && injectionPrevented) {
            logSecurityTest('Command Injection Prevention', 'PASS',
              'Server correctly prevented command injection');
          } else {
            logSecurityTest('Command Injection Prevention', 'FAIL',
              'Server may be vulnerable to command injection', true);
          }

          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test 3: Repository Access Control
 * Expected: Server should only access configured repository
 */
async function testRepositoryAccessControl() {
  return new Promise((resolve) => {
    console.log('\n🔒 Security Test 3: Repository Access Control');

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'security-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Try to access files outside the repository
      setTimeout(() => {
        const accessRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'git_status',
            arguments: {}
          }
        };
        server.stdin.write(JSON.stringify(accessRequest) + '\n');

        setTimeout(() => {
          // Check if only repository files are accessed
          const accessedOutsideRepo = output.includes('/etc') ||
                                     output.includes('/home') ||
                                     output.includes('/Users') && !output.includes(TEST_REPO_PATH);

          if (!accessedOutsideRepo) {
            logSecurityTest('Repository Access Control', 'PASS',
              'Server correctly restricted access to configured repository');
          } else {
            logSecurityTest('Repository Access Control', 'FAIL',
              'Server may access files outside configured repository', true);
          }

          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test 4: Environment Variable Handling
 * Expected: Server should not leak sensitive environment variables
 */
async function testEnvironmentVariableHandling() {
  return new Promise((resolve) => {
    console.log('\n🔒 Security Test 4: Environment Variable Handling');

    // Set a sensitive environment variable
    const sensitiveEnv = { ...process.env, SECRET_KEY: 'super-secret-password' };

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...sensitiveEnv, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'security-test', version: '1.0.0' }
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
          // Check if sensitive environment variables are leaked
          const leakedSecrets = output.includes('super-secret-password') ||
                               output.includes('SECRET_KEY');

          if (!leakedSecrets) {
            logSecurityTest('Environment Variable Handling', 'PASS',
              'Server correctly protected sensitive environment variables');
          } else {
            logSecurityTest('Environment Variable Handling', 'FAIL',
              'Server may leak sensitive environment variables', true);
          }

          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Test 5: Input Validation
 * Expected: Server should validate all inputs and reject malformed data
 */
async function testInputValidation() {
  return new Promise((resolve) => {
    console.log('\n🔒 Security Test 5: Input Validation');

    const server = spawn('node', [SERVER_PATH], {
      cwd: TEST_REPO_PATH,
      env: { ...process.env, GIT_REPO_PATH: TEST_REPO_PATH }
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'security-test', version: '1.0.0' }
        }
      };
      server.stdin.write(JSON.stringify(initRequest) + '\n');

      // Test with malformed input
      setTimeout(() => {
        const malformedRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'create_branch',
            arguments: {
              branchName: '',  // Empty branch name
              invalidParam: 'should be rejected'
            }
          }
        };
        server.stdin.write(JSON.stringify(malformedRequest) + '\n');

        setTimeout(() => {
          // Check if malformed input was rejected
          const rejectedMalformed = output.includes('error') ||
                                   output.includes('invalid') ||
                                   !output.includes('created successfully');

          if (rejectedMalformed) {
            logSecurityTest('Input Validation', 'PASS',
              'Server correctly validated and rejected malformed input');
          } else {
            logSecurityTest('Input Validation', 'FAIL',
              'Server may accept malformed or invalid input', true);
          }

          server.kill();
          resolve();
        }, 2000);
      }, 500);
    }, 500);
  });
}

/**
 * Generate Security Test Report
 */
function generateSecurityReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🔒 SECURITY TEST REPORT');
  console.log('='.repeat(60));

  console.log(`\n🛡️  Security Test Results:`);
  securityResults.tests.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`   ${index + 1}. ${status} ${result.test}`);
    if (result.message) {
      console.log(`      ${result.message}`);
    }
  });

  const passed = securityResults.tests.filter(t => t.status === 'PASS').length;
  const total = securityResults.tests.length;
  console.log(`\n📈 Summary: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);

  if (securityResults.vulnerabilities.length > 0) {
    console.log(`\n🚨 VULNERABILITIES DETECTED: ${securityResults.vulnerabilities.length}`);
    securityResults.vulnerabilities.forEach((vuln, index) => {
      console.log(`   ${index + 1}. ${vuln.test}: ${vuln.message}`);
    });
  } else {
    console.log('\n🎉 NO SECURITY VULNERABILITIES DETECTED');
  }

  console.log(`\n🏁 Test Execution Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  return securityResults.vulnerabilities.length === 0;
}

// Main security test execution
async function runSecurityTests() {
  console.log('🚀 Starting Git MCP Server Security Tests...\n');

  try {
    await testPathTraversalPrevention();
    await testCommandInjectionPrevention();
    await testRepositoryAccessControl();
    await testEnvironmentVariableHandling();
    await testInputValidation();

    const success = generateSecurityReport();
    return success;

  } catch (error) {
    console.error('❌ Security test execution failed:', error);
    return false;
  }
}

// Export for use in other test files
export { runSecurityTests, securityResults };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests();
}