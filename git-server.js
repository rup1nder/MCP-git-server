#!/usr/bin/env node
import simpleGit from 'simple-git';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Default repository path - can be overridden via environment variable
const REPO_PATH = process.env.GIT_REPO_PATH || process.cwd();

// Input validation functions
export function validatePath(path) {
  if (!path || typeof path !== 'string') {
    throw new Error('Path must be a non-empty string');
  }

  // Prevent path traversal
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    throw new Error('Invalid path: path traversal not allowed');
  }

  // Prevent absolute paths and other dangerous patterns
  if (path.match(/^\/|[<>|&;$`]/)) {
    throw new Error('Invalid path: dangerous characters not allowed');
  }

  return path;
}

export function validateBranchName(branchName) {
  if (!branchName || typeof branchName !== 'string') {
    throw new Error('Branch name must be a non-empty string');
  }

  // Prevent command injection and dangerous characters
  if (branchName.match(/[<>|&;$`\\]/) || branchName.includes('..')) {
    throw new Error('Invalid branch name: dangerous characters not allowed');
  }

  // Prevent empty or whitespace-only names
  if (branchName.trim().length === 0) {
    throw new Error('Branch name cannot be empty or whitespace-only');
  }

  return branchName.trim();
}

export function validateCommitMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Commit message must be a non-empty string');
  }

  // Prevent command injection
  if (message.match(/[<>|&;$`\\]/)) {
    throw new Error('Invalid commit message: dangerous characters not allowed');
  }

  return message;
}

// Function to create git instance with error handling
export function createGitInstance() {
  try {
    return simpleGit(REPO_PATH);
  } catch (error) {
    throw new Error(`Failed to initialize git repository at ${REPO_PATH}: ${error.message}`);
  }
}

// Create an MCP server
export const server = new Server({
  name: "git-server",
  version: "0.1.0"
});

// Define available tools
export const tools = [
  {
    name: "git_status",
    description: "Get the current Git repository status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_branch",
    description: "Create a new Git branch",
    inputSchema: {
      type: "object",
      properties: {
        branchName: { type: "string", description: "Name of the new branch" },
        fromBranch: { type: "string", description: "Source branch to create from (optional)" },
      },
      required: ["branchName"],
    },
  },
  {
    name: "switch_branch",
    description: "Switch to a different Git branch",
    inputSchema: {
      type: "object",
      properties: {
        branchName: { type: "string", description: "Name of the branch to switch to" },
      },
      required: ["branchName"],
    },
  },
  {
    name: "list_branches",
    description: "List all Git branches",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "merge_branch",
    description: "Merge branches",
    inputSchema: {
      type: "object",
      properties: {
        sourceBranch: { type: "string", description: "Branch to merge from" },
        targetBranch: { type: "string", description: "Branch to merge into (optional)" },
      },
      required: ["sourceBranch"],
    },
  },
  {
    name: "create_worktree",
    description: "Create a new Git worktree",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path for the new worktree" },
        branch: { type: "string", description: "Branch for the worktree (optional)" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_worktrees",
    description: "List all Git worktrees",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "remove_worktree",
    description: "Remove a Git worktree",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path of the worktree to remove" },
      },
      required: ["path"],
    },
  },
  {
    name: "commit_changes",
    description: "Commit changes",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Commit message" },
        files: { type: "array", items: { type: "string" }, description: "Specific files to commit (optional)" },
      },
      required: ["message"],
    },
  },
  {
    name: "push_changes",
    description: "Push changes to remote",
    inputSchema: {
      type: "object",
      properties: {
        remote: { type: "string", description: "Remote name (optional, defaults to 'origin')" },
        branch: { type: "string", description: "Branch to push (optional)" },
      },
    },
  },
  {
    name: "pull_changes",
    description: "Pull changes from remote",
    inputSchema: {
      type: "object",
      properties: {
        remote: { type: "string", description: "Remote name (optional, defaults to 'origin')" },
        branch: { type: "string", description: "Branch to pull (optional)" },
      },
    },
  },
];

// Tool execution handler
export async function executeTool(name, args) {
  switch (name) {
    case "git_status":
      try {
        const git = createGitInstance();
        const status = await git.status();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Git status error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "create_branch":
      try {
        const git = createGitInstance();
        const { branchName, fromBranch } = args;
        const validatedBranchName = validateBranchName(branchName);
        const validatedFromBranch = fromBranch ? validateBranchName(fromBranch) : undefined;

        if (validatedFromBranch) {
          await git.checkoutBranch(validatedBranchName, validatedFromBranch);
        } else {
          await git.checkoutLocalBranch(validatedBranchName);
        }
        return {
          content: [
            {
              type: "text",
              text: `Branch '${validatedBranchName}' created successfully${validatedFromBranch ? ` from '${validatedFromBranch}'` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Create branch error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "switch_branch":
      try {
        const git = createGitInstance();
        const { branchName } = args;
        const validatedBranchName = validateBranchName(branchName);
        await git.checkout(validatedBranchName);
        return {
          content: [
            {
              type: "text",
              text: `Switched to branch '${validatedBranchName}'`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Switch branch error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "list_branches":
      try {
        const git = createGitInstance();
        const branches = await git.branch();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(branches, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `List branches error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "create_worktree":
      try {
        const git = createGitInstance();
        const { path, branch } = args;
        const validatedPath = validatePath(path);
        const validatedBranch = branch ? validateBranchName(branch) : undefined;
        const worktreeBranch = validatedBranch || validatedPath.split('/').pop() || 'worktree-branch';
        // Use -b flag to create a new branch for the worktree
        await git.raw(['worktree', 'add', '-b', worktreeBranch, validatedPath]);
        return {
          content: [
            {
              type: "text",
              text: `Worktree created at '${validatedPath}' on new branch '${worktreeBranch}'`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Create worktree error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "list_worktrees":
      try {
        const git = createGitInstance();
        const worktrees = await git.raw(['worktree', 'list']);
        return {
          content: [
            {
              type: "text",
              text: worktrees,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `List worktrees error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "merge_branch":
      try {
        const git = createGitInstance();
        const { sourceBranch, targetBranch } = args;
        const validatedSourceBranch = validateBranchName(sourceBranch);
        const validatedTargetBranch = targetBranch ? validateBranchName(targetBranch) : undefined;

        if (validatedTargetBranch) {
          await git.checkout(validatedTargetBranch);
        }
        await git.merge([validatedSourceBranch]);
        return {
          content: [
            {
              type: "text",
              text: `Merged '${validatedSourceBranch}' into '${validatedTargetBranch || 'current branch'}'`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Merge error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "remove_worktree":
      try {
        const git = createGitInstance();
        const { path } = args;
        const validatedPath = validatePath(path);
        await git.raw(['worktree', 'remove', validatedPath]);
        return {
          content: [
            {
              type: "text",
              text: `Worktree at '${validatedPath}' removed successfully`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Remove worktree error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "commit_changes":
      try {
        const git = createGitInstance();
        const { message, files } = args;
        const validatedMessage = validateCommitMessage(message);

        if (files && files.length > 0) {
          // Validate file paths if provided
          const validatedFiles = files.map(file => {
            if (typeof file !== 'string') {
              throw new Error('File paths must be strings');
            }
            // Basic validation for file paths
            if (file.includes('..') || file.startsWith('/') || file.includes('\\') || file.match(/[<>|&;$`]/)) {
              throw new Error(`Invalid file path: ${file}`);
            }
            return file;
          });
          await git.add(validatedFiles);
        } else {
          await git.add('.');
        }
        const result = await git.commit(validatedMessage);
        return {
          content: [
            {
              type: "text",
              text: `Changes committed: ${result.commit}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Commit error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "push_changes":
      try {
        const git = createGitInstance();
        const { remote = 'origin', branch } = args;
        if (branch) {
          await git.push(remote, branch);
        } else {
          await git.push();
        }
        return {
          content: [
            {
              type: "text",
              text: `Changes pushed to ${remote}${branch ? `/${branch}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Push error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    case "pull_changes":
      try {
        const git = createGitInstance();
        const { remote = 'origin', branch } = args;
        if (branch) {
          await git.pull(remote, branch);
        } else {
          await git.pull();
        }
        return {
          content: [
            {
              type: "text",
              text: `Changes pulled from ${remote}${branch ? `/${branch}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Pull error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
}


// Set up protocol handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  return await executeTool(name, args);
});

// Start receiving messages on stdin and sending messages on stdout
export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Git MCP server running on stdio');
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}