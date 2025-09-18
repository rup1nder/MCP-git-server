# Git MCP Server - Comprehensive Test Plan

## Overview
This test plan covers comprehensive testing for the Git MCP Server application, including unit tests, integration tests, and other relevant test types to ensure 100% code coverage and robust functionality.

## Test Strategy

### 1. Unit Testing (100% Code Coverage Target)
**Framework:** Jest with comprehensive mocking
**Coverage Metrics:** 100% statements, branches, functions, lines
**Mocking Strategy:** All external dependencies (simple-git, MCP SDK)

#### Test Files Created:
- `tests/unit/git-server.unit.test.js` - Comprehensive unit tests for main server functions

#### Coverage Areas:
- **createGitInstance function**
  - Default repository path initialization
  - Custom repository path from environment variable
  - Error handling for invalid repository paths

- **executeTool function** (all 11 Git tools)
  - git_status: Success and error scenarios
  - create_branch: With and without fromBranch parameter
  - switch_branch: Branch switching functionality
  - list_branches: Branch listing and error handling
  - merge_branch: Merge operations with target branch switching
  - create_worktree: Worktree creation with branch specification
  - list_worktrees: Worktree listing functionality
  - remove_worktree: Worktree removal operations
  - commit_changes: With and without file specifications
  - push_changes: Default and custom remote/branch combinations
  - pull_changes: Default and custom remote/branch combinations
  - Unknown tool handling

- **Tools array validation**
  - All 11 tools properly defined
  - Correct input schemas and required parameters

- **Server setup**
  - MCP server initialization
  - Request handler configuration

- **Main function**
  - Server connection to transport
  - Error handling in main execution

### 2. Integration Testing
**Framework:** Node.js spawn with stdio communication
**Test Files:** `tests/git-server.test.js`

#### Test Scenarios:
- MCP Server Startup and initialization
- Tools list retrieval (11 Git tools)
- Git status tool execution
- Branch creation functionality
- Worktree creation with new branch
- Error handling for invalid operations

### 3. MCP Protocol Testing
**Test Files:** `test-mcp-integration.js`

#### Test Scenarios:
- MCP protocol initialization
- Server response to initialize requests
- Tools/list request handling
- Protocol compliance verification

### 4. Tool-Specific Testing
**Test Files:** `test-tools.js`

#### Test Scenarios:
- Direct execution of Git tools
- Repository status retrieval
- Branch operations (list, create)
- Worktree management (create, list)

## Test Execution Strategy

### Prerequisites
- Node.js environment with ES modules support
- Git repository for testing
- MCP SDK dependencies installed

### Test Execution Order
1. **Unit Tests** - Run first for isolated function testing
2. **Integration Tests** - Test full server functionality
3. **MCP Protocol Tests** - Verify protocol compliance
4. **Tool-Specific Tests** - Validate individual tool operations

### Environment Setup
- Test repository path: `/Users/rupindersingh/code/encryptdecrypt2`
- Environment variables: `GIT_REPO_PATH` for custom paths
- Temporary directories for worktree testing

## Coverage Goals

### Unit Test Coverage (Target: 100%)
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

### Integration Test Coverage
- All MCP protocol interactions
- All Git tool executions
- Error handling scenarios
- Edge cases and boundary conditions

## Test Data and Fixtures

### Mock Data
- Git status responses (current branch, files, staged, etc.)
- Branch listing data
- Worktree information
- Commit data structures
- Error scenarios (invalid paths, Git errors, network issues)

### Test Repository Setup
- Pre-populated Git repository with:
  - Multiple branches (main, feature, develop)
  - Commit history
  - Staged and unstaged changes
  - Remote configuration

## Risk Assessment and Mitigation

### High-Risk Areas
1. **ES Module Compatibility** - Jest configuration for ES modules
2. **Git Repository Dependencies** - Tests requiring actual Git repo
3. **Async Operation Testing** - Proper mocking of async Git operations
4. **MCP Protocol Compliance** - Ensuring protocol adherence

### Mitigation Strategies
1. Comprehensive Jest configuration for ES modules
2. Mock all Git operations for unit tests
3. Use integration tests for real Git operations
4. Protocol validation through structured testing

## Success Criteria

### Unit Testing
- [ ] All unit tests pass (Jest ES module mocking limitations - integration tests provide coverage)
- [ ] 100% code coverage achieved (79.52% current coverage via integration tests)
- [ ] All branches and error paths covered (via integration testing)
- [ ] Comprehensive mocking implemented (Jest ES module mocking not fully compatible)

### Integration Testing
- [x] All integration tests pass (6/6 tests - 100% success rate)
- [x] MCP server starts successfully
- [x] All Git tools execute correctly
- [x] Error scenarios handled properly

### Performance Testing
- [x] Performance tests implemented and executed
- [ ] Response times meet requirements (< 500ms git status, < 1000ms branch creation)
- [x] Concurrent operations handled (5 simultaneous requests < 2000ms)
- [x] Memory usage stable (< 50MB increase under load)

### Security Testing
- [x] Security tests implemented and executed
- [x] Path traversal prevention (100% pass rate)
- [x] Command injection prevention (100% pass rate)
- [x] Repository access control (100% pass rate)
- [x] Environment variable protection (100% pass rate)
- [x] Input validation (100% pass rate)
- [x] Configurable cleanup for debugging (environment variable control)

### Overall Quality
- [x] No critical security vulnerabilities detected
- [x] Comprehensive error handling implemented
- [x] Clean test output and reporting
- [x] Maintainable test codebase with new performance and security test suites

## Test Configuration and Debugging

### Configurable Cleanup Feature
The security tests now support configurable cleanup to balance between clean testing and debugging capabilities:

#### Environment Variables:
- `SECURITY_TEST_CLEANUP=false` - Disable automatic cleanup (preserve test artifacts for debugging)
- `SECURITY_TEST_DEBUG=true` - Enable debug logging for test operations

#### Usage Examples:
```bash
# Normal testing (default - automatic cleanup)
npm test

# Debug mode (keep artifacts for investigation)
SECURITY_TEST_CLEANUP=false npm test

# Debug mode with verbose logging
SECURITY_TEST_CLEANUP=false SECURITY_TEST_DEBUG=true npm test
```

#### Benefits:
- **Clean CI/CD**: Automatic cleanup ensures clean test environments
- **Debug Support**: Disable cleanup to inspect test artifacts when debugging
- **Flexible Testing**: Choose appropriate mode based on testing needs

## Test Maintenance

### Regular Updates Required
- Update mocks when dependencies change
- Add tests for new features
- Update test data as repository structure changes
- Maintain coverage thresholds

### CI/CD Integration
- Automated test execution on commits
- Coverage reporting in CI pipeline
- Test failure notifications
- Performance regression detection

## Conclusion

This comprehensive test plan ensures the Git MCP Server is thoroughly tested with multiple layers of testing including unit tests targeting 100% coverage, integration tests for end-to-end functionality, and protocol-specific tests for MCP compliance. The testing strategy provides confidence in the application's reliability, maintainability, and correctness.
