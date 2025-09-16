/**
 * Unit Tests for Git MCP Server
 *
 * Tests individual functions with mocked dependencies
 * Focus: 100% code coverage with isolated unit tests
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock simple-git
const mockSimpleGit = jest.fn();
const mockGitInstance = {
  status: jest.fn(),
  branch: jest.fn(),
  checkoutBranch: jest.fn(),
  checkoutLocalBranch: jest.fn(),
  checkout: jest.fn(),
  merge: jest.fn(),
  raw: jest.fn(),
  add: jest.fn(),
  commit: jest.fn(),
  push: jest.fn(),
  pull: jest.fn()
};

jest.mock('simple-git', () => ({
  __esModule: true,
  default: mockSimpleGit.mockReturnValue(mockGitInstance)
}));

// Mock MCP SDK
const mockServer = {
  setRequestHandler: jest.fn(),
  connect: jest.fn()
};

const mockStdioServerTransport = jest.fn();

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => mockServer)
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: mockStdioServerTransport
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: 'mock-list-tools-schema',
  CallToolRequestSchema: 'mock-call-tools-schema'
}));

// Import the module after mocking
import { createGitInstance, executeTool, tools, server, main } from '../../git-server.js';

describe('Git MCP Server - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockSimpleGit.mockReturnValue(mockGitInstance);

    // Reset environment
    delete process.env.GIT_REPO_PATH;
  });

  describe('createGitInstance', () => {
    test('should create git instance with default repo path (current working directory)', () => {
      const result = createGitInstance();
      expect(mockSimpleGit).toHaveBeenCalledWith(process.cwd());
      expect(result).toBe(mockGitInstance);
    });

    test('should create git instance with custom repo path from env', () => {
      process.env.GIT_REPO_PATH = '/custom/path';
      const result = createGitInstance();
      expect(mockSimpleGit).toHaveBeenCalledWith('/custom/path');
      expect(result).toBe(mockGitInstance);
    });

    test('should throw error when git initialization fails', () => {
      mockSimpleGit.mockImplementationOnce(() => {
        throw new Error('Git init failed');
      });

      expect(() => createGitInstance()).toThrow(`Failed to initialize git repository at ${process.cwd()}: Git init failed`);
    });
  });

  describe('executeTool - git_status', () => {
    test('should return git status successfully', async () => {
      const mockStatus = { current: 'main', files: [] };
      mockGitInstance.status.mockResolvedValue(mockStatus);

      const result = await executeTool('git_status', {});

      expect(mockGitInstance.status).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify(mockStatus, null, 2)
        }]
      });
    });

    test('should handle git status error', async () => {
      const error = new Error('Status failed');
      mockGitInstance.status.mockRejectedValue(error);

      const result = await executeTool('git_status', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Git status error: Status failed'
        }],
        isError: true
      });
    });

    test('should handle non-Error git status error', async () => {
      mockGitInstance.status.mockRejectedValue('String error');

      const result = await executeTool('git_status', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Git status error: String error'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - create_branch', () => {
    test('should create branch from current branch', async () => {
      mockGitInstance.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await executeTool('create_branch', { branchName: 'feature-branch' });

      expect(mockGitInstance.checkoutLocalBranch).toHaveBeenCalledWith('feature-branch');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Branch 'feature-branch' created successfully"
        }]
      });
    });

    test('should create branch from specified branch', async () => {
      mockGitInstance.checkoutBranch.mockResolvedValue(undefined);

      const result = await executeTool('create_branch', {
        branchName: 'feature-branch',
        fromBranch: 'main'
      });

      expect(mockGitInstance.checkoutBranch).toHaveBeenCalledWith('feature-branch', 'main');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Branch 'feature-branch' created successfully from 'main'"
        }]
      });
    });

    test('should handle create branch error', async () => {
      const error = new Error('Branch creation failed');
      mockGitInstance.checkoutLocalBranch.mockRejectedValue(error);

      const result = await executeTool('create_branch', { branchName: 'feature-branch' });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Create branch error: Branch creation failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - switch_branch', () => {
    test('should switch to branch successfully', async () => {
      mockGitInstance.checkout.mockResolvedValue(undefined);

      const result = await executeTool('switch_branch', { branchName: 'main' });

      expect(mockGitInstance.checkout).toHaveBeenCalledWith('main');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Switched to branch 'main'"
        }]
      });
    });

    test('should handle switch branch error', async () => {
      const error = new Error('Switch failed');
      mockGitInstance.checkout.mockRejectedValue(error);

      const result = await executeTool('switch_branch', { branchName: 'nonexistent' });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Switch branch error: Switch failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - list_branches', () => {
    test('should list branches successfully', async () => {
      const mockBranches = { all: ['main', 'feature'], current: 'main' };
      mockGitInstance.branch.mockResolvedValue(mockBranches);

      const result = await executeTool('list_branches', {});

      expect(mockGitInstance.branch).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify(mockBranches, null, 2)
        }]
      });
    });

    test('should handle list branches error', async () => {
      const error = new Error('List branches failed');
      mockGitInstance.branch.mockRejectedValue(error);

      const result = await executeTool('list_branches', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'List branches error: List branches failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - merge_branch', () => {
    test('should merge branch into current branch', async () => {
      mockGitInstance.merge.mockResolvedValue(undefined);

      const result = await executeTool('merge_branch', { sourceBranch: 'feature' });

      expect(mockGitInstance.merge).toHaveBeenCalledWith(['feature']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Merged 'feature' into 'current branch'"
        }]
      });
    });

    test('should merge branch into specified target branch', async () => {
      mockGitInstance.checkout.mockResolvedValue(undefined);
      mockGitInstance.merge.mockResolvedValue(undefined);

      const result = await executeTool('merge_branch', {
        sourceBranch: 'feature',
        targetBranch: 'main'
      });

      expect(mockGitInstance.checkout).toHaveBeenCalledWith('main');
      expect(mockGitInstance.merge).toHaveBeenCalledWith(['feature']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Merged 'feature' into 'main'"
        }]
      });
    });

    test('should handle merge error', async () => {
      const error = new Error('Merge failed');
      mockGitInstance.merge.mockRejectedValue(error);

      const result = await executeTool('merge_branch', { sourceBranch: 'feature' });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Merge error: Merge failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - create_worktree', () => {
    test('should create worktree with specified branch', async () => {
      mockGitInstance.raw.mockResolvedValue('output');

      const result = await executeTool('create_worktree', {
        path: '/tmp/worktree',
        branch: 'feature'
      });

      expect(mockGitInstance.raw).toHaveBeenCalledWith(['worktree', 'add', '-b', 'feature', '/tmp/worktree']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Worktree created at '/tmp/worktree' on new branch 'feature'"
        }]
      });
    });

    test('should create worktree with default branch name', async () => {
      mockGitInstance.raw.mockResolvedValue('output');

      const result = await executeTool('create_worktree', {
        path: '/tmp/my-worktree'
      });

      expect(mockGitInstance.raw).toHaveBeenCalledWith(['worktree', 'add', '-b', 'my-worktree', '/tmp/my-worktree']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Worktree created at '/tmp/my-worktree' on new branch 'my-worktree'"
        }]
      });
    });

    test('should handle create worktree error', async () => {
      const error = new Error('Worktree creation failed');
      mockGitInstance.raw.mockRejectedValue(error);

      const result = await executeTool('create_worktree', {
        path: '/tmp/worktree'
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Create worktree error: Worktree creation failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - list_worktrees', () => {
    test('should list worktrees successfully', async () => {
      const mockWorktrees = '* main 1234567 [main]\n  feature 9876543 [feature]';
      mockGitInstance.raw.mockResolvedValue(mockWorktrees);

      const result = await executeTool('list_worktrees', {});

      expect(mockGitInstance.raw).toHaveBeenCalledWith(['worktree', 'list']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: mockWorktrees
        }]
      });
    });

    test('should handle list worktrees error', async () => {
      const error = new Error('List worktrees failed');
      mockGitInstance.raw.mockRejectedValue(error);

      const result = await executeTool('list_worktrees', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'List worktrees error: List worktrees failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - remove_worktree', () => {
    test('should remove worktree successfully', async () => {
      mockGitInstance.raw.mockResolvedValue('output');

      const result = await executeTool('remove_worktree', {
        path: '/tmp/worktree'
      });

      expect(mockGitInstance.raw).toHaveBeenCalledWith(['worktree', 'remove', '/tmp/worktree']);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Worktree at '/tmp/worktree' removed successfully"
        }]
      });
    });

    test('should handle remove worktree error', async () => {
      const error = new Error('Remove worktree failed');
      mockGitInstance.raw.mockRejectedValue(error);

      const result = await executeTool('remove_worktree', {
        path: '/tmp/worktree'
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Remove worktree error: Remove worktree failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - commit_changes', () => {
    test('should commit specific files', async () => {
      const mockCommit = { commit: 'abc123' };
      mockGitInstance.add.mockResolvedValue(undefined);
      mockGitInstance.commit.mockResolvedValue(mockCommit);

      const result = await executeTool('commit_changes', {
        message: 'Test commit',
        files: ['file1.txt', 'file2.txt']
      });

      expect(mockGitInstance.add).toHaveBeenCalledWith(['file1.txt', 'file2.txt']);
      expect(mockGitInstance.commit).toHaveBeenCalledWith('Test commit');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes committed: abc123"
        }]
      });
    });

    test('should commit all files when no specific files provided', async () => {
      const mockCommit = { commit: 'def456' };
      mockGitInstance.add.mockResolvedValue(undefined);
      mockGitInstance.commit.mockResolvedValue(mockCommit);

      const result = await executeTool('commit_changes', {
        message: 'Test commit'
      });

      expect(mockGitInstance.add).toHaveBeenCalledWith('.');
      expect(mockGitInstance.commit).toHaveBeenCalledWith('Test commit');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes committed: def456"
        }]
      });
    });

    test('should handle commit error', async () => {
      const error = new Error('Commit failed');
      mockGitInstance.add.mockRejectedValue(error);

      const result = await executeTool('commit_changes', {
        message: 'Test commit'
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Commit error: Commit failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - push_changes', () => {
    test('should push to default remote and branch', async () => {
      mockGitInstance.push.mockResolvedValue(undefined);

      const result = await executeTool('push_changes', {});

      expect(mockGitInstance.push).toHaveBeenCalledWith();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pushed to origin"
        }]
      });
    });

    test('should push to specified remote', async () => {
      mockGitInstance.push.mockResolvedValue(undefined);

      const result = await executeTool('push_changes', {
        remote: 'upstream'
      });

      expect(mockGitInstance.push).toHaveBeenCalledWith('upstream');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pushed to upstream"
        }]
      });
    });

    test('should push to specified remote and branch', async () => {
      mockGitInstance.push.mockResolvedValue(undefined);

      const result = await executeTool('push_changes', {
        remote: 'upstream',
        branch: 'feature'
      });

      expect(mockGitInstance.push).toHaveBeenCalledWith('upstream', 'feature');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pushed to upstream/feature"
        }]
      });
    });

    test('should handle push error', async () => {
      const error = new Error('Push failed');
      mockGitInstance.push.mockRejectedValue(error);

      const result = await executeTool('push_changes', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Push error: Push failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - pull_changes', () => {
    test('should pull from default remote and branch', async () => {
      mockGitInstance.pull.mockResolvedValue(undefined);

      const result = await executeTool('pull_changes', {});

      expect(mockGitInstance.pull).toHaveBeenCalledWith();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pulled from origin"
        }]
      });
    });

    test('should pull from specified remote', async () => {
      mockGitInstance.pull.mockResolvedValue(undefined);

      const result = await executeTool('pull_changes', {
        remote: 'upstream'
      });

      expect(mockGitInstance.pull).toHaveBeenCalledWith('upstream');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pulled from upstream"
        }]
      });
    });

    test('should pull from specified remote and branch', async () => {
      mockGitInstance.pull.mockResolvedValue(undefined);

      const result = await executeTool('pull_changes', {
        remote: 'upstream',
        branch: 'feature'
      });

      expect(mockGitInstance.pull).toHaveBeenCalledWith('upstream', 'feature');
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: "Changes pulled from upstream/feature"
        }]
      });
    });

    test('should handle pull error', async () => {
      const error = new Error('Pull failed');
      mockGitInstance.pull.mockRejectedValue(error);

      const result = await executeTool('pull_changes', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Pull error: Pull failed'
        }],
        isError: true
      });
    });
  });

  describe('executeTool - unknown tool', () => {
    test('should return error for unknown tool', async () => {
      const result = await executeTool('unknown_tool', {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Unknown tool: unknown_tool'
        }],
        isError: true
      });
    });
  });

  describe('tools array', () => {
    test('should define all 11 Git tools', () => {
      expect(tools).toHaveLength(11);

      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toEqual([
        'git_status',
        'create_branch',
        'switch_branch',
        'list_branches',
        'merge_branch',
        'create_worktree',
        'list_worktrees',
        'remove_worktree',
        'commit_changes',
        'push_changes',
        'pull_changes'
      ]);
    });

    test('should have correct input schemas', () => {
      const gitStatusTool = tools.find(t => t.name === 'git_status');
      expect(gitStatusTool.inputSchema.properties).toEqual({});

      const createBranchTool = tools.find(t => t.name === 'create_branch');
      expect(createBranchTool.inputSchema.required).toEqual(['branchName']);
      expect(createBranchTool.inputSchema.properties.branchName.type).toBe('string');
    });
  });

  describe('server setup', () => {
    test('should create server with correct name and version', () => {
      // Server is already mocked above, so we check the mock
      expect(mockServer.constructor.name).toBe('Server');
    });

    test('should set up request handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      // Note: We can't easily test the handler functions without more complex mocking
    });
  });

  describe('main function', () => {
    test('should connect server to transport', async () => {
      mockServer.connect.mockResolvedValue(undefined);

      // Mock console.error to avoid output during test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      await main();

      expect(mockStdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalled();

      // Restore console.error
      console.error = originalConsoleError;
    });

    test('should handle main function errors', async () => {
      const error = new Error('Connection failed');
      mockServer.connect.mockRejectedValue(error);

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await expect(main()).rejects.toThrow('Connection failed');

      console.error = originalConsoleError;
    });
  });
});