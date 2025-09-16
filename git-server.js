#!/usr/bin/env node
import simpleGit from 'simple-git';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Default repository path - can be overridden via environment variable
const REPO_PATH = process.env.GIT_REPO_PATH || process.cwd();

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
        if (fromBranch) {
          await git.checkoutBranch(branchName, fromBranch);
        } else {
          await git.checkoutLocalBranch(branchName);
        }
        return {
          content: [
            {
              type: "text",
              text: `Branch '${branchName}' created successfully${fromBranch ? ` from '${fromBranch}'` : ''}`,
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
        await git.checkout(branchName);
        return {
          content: [
            {
              type: "text",
              text: `Switched to branch '${branchName}'`,
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
        const worktreeBranch = branch || path.split('/').pop() || 'worktree-branch';
        // Use -b flag to create a new branch for the worktree
        await git.raw(['worktree', 'add', '-b', worktreeBranch, path]);
        return {
          content: [
            {
              type: "text",
              text: `Worktree created at '${path}' on new branch '${worktreeBranch}'`,
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
        if (targetBranch) {
          await git.checkout(targetBranch);
        }
        await git.merge([sourceBranch]);
        return {
          content: [
            {
              type: "text",
              text: `Merged '${sourceBranch}' into '${targetBranch || 'current branch'}'`,
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
        await git.raw(['worktree', 'remove', path]);
        return {
          content: [
            {
              type: "text",
              text: `Worktree at '${path}' removed successfully`,
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
        if (files && files.length > 0) {
          await git.add(files);
        } else {
          await git.add('.');
        }
        const result = await git.commit(message);
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