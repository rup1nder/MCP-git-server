#!/usr/bin/env node
import { z } from "zod";
import simpleGit, { SimpleGit } from 'simple-git';

// Default repository path - can be overridden via environment variable
const REPO_PATH = process.env.GIT_REPO_PATH || process.cwd();

// Initialize git instance
const git: SimpleGit = simpleGit(REPO_PATH);

// Define tool schemas
const gitStatusSchema = z.object({});
const createBranchSchema = z.object({
  branchName: z.string().describe("Name of the new branch"),
  fromBranch: z.string().optional().describe("Source branch to create from (defaults to current)")
});
const switchBranchSchema = z.object({
  branchName: z.string().describe("Name of the branch to switch to")
});
const listBranchesSchema = z.object({});
const mergeBranchSchema = z.object({
  sourceBranch: z.string().describe("Branch to merge from"),
  targetBranch: z.string().optional().describe("Branch to merge into (defaults to current)")
});
const createWorktreeSchema = z.object({
  path: z.string().describe("Path for the new worktree"),
  branch: z.string().optional().describe("Branch for the worktree (defaults to new branch with same name as path)")
});
const listWorktreesSchema = z.object({});
const removeWorktreeSchema = z.object({
  path: z.string().describe("Path of the worktree to remove")
});
const commitChangesSchema = z.object({
  message: z.string().describe("Commit message"),
  files: z.array(z.string()).optional().describe("Specific files to commit (defaults to all)")
});
const pushChangesSchema = z.object({
  remote: z.string().optional().describe("Remote name (defaults to 'origin')"),
  branch: z.string().optional().describe("Branch to push (defaults to current)")
});
const pullChangesSchema = z.object({
  remote: z.string().optional().describe("Remote name (defaults to 'origin')"),
  branch: z.string().optional().describe("Branch to pull (defaults to current)")
});
const gitDiffSchema = z.object({
  repo_path: z.string().describe("Path to the git repository"),
  source: z.string().optional().describe("Source commit/branch to compare from. Defaults to HEAD"),
  target: z.string().optional().describe("Target commit/branch to compare to. If not specified, compares working directory to source"),
  files: z.array(z.string()).optional().describe("Specific files to include in the diff")
});

// Tool implementations
const tools = {
  git_status: {
    schema: gitStatusSchema,
    handler: async () => {
      try {
        const status = await git.status();
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Git status error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  create_branch: {
    schema: createBranchSchema,
    handler: async (args: { branchName: string; fromBranch?: string }) => {
      try {
        if (args.fromBranch) {
          await git.checkoutBranch(args.branchName, args.fromBranch);
        } else {
          await git.checkoutLocalBranch(args.branchName);
        }
        return {
          content: [{ type: "text", text: `Branch '${args.branchName}' created successfully${args.fromBranch ? ` from '${args.fromBranch}'` : ''}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Create branch error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  switch_branch: {
    schema: switchBranchSchema,
    handler: async (args: { branchName: string }) => {
      try {
        await git.checkout(args.branchName);
        return {
          content: [{ type: "text", text: `Switched to branch '${args.branchName}'` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Switch branch error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  list_branches: {
    schema: listBranchesSchema,
    handler: async () => {
      try {
        const branches = await git.branch();
        return {
          content: [{ type: "text", text: JSON.stringify(branches, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `List branches error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    } 
  },

  merge_branch: {
    schema: mergeBranchSchema,
    handler: async (args: { sourceBranch: string; targetBranch?: string }) => {
      try {
        if (args.targetBranch) {
          await git.checkout(args.targetBranch);
        }
        await git.merge([args.sourceBranch]);
        return {
          content: [{ type: "text", text: `Merged '${args.sourceBranch}' into '${args.targetBranch || 'current branch'}'` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Merge error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  create_worktree: {
    schema: createWorktreeSchema,
    handler: async (args: { path: string; branch?: string }) => {
      try {
        const worktreeBranch = args.branch || args.path.split('/').pop() || 'worktree-branch';
        await git.raw(['worktree', 'add', args.path, worktreeBranch]);
        return {
          content: [{ type: "text", text: `Worktree created at '${args.path}' on branch '${worktreeBranch}'` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Create worktree error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  list_worktrees: {
    schema: listWorktreesSchema,
    handler: async () => {
      try {
        const worktrees = await git.raw(['worktree', 'list']);
        return {
          content: [{ type: "text", text: worktrees }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `List worktrees error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  remove_worktree: {
    schema: removeWorktreeSchema,
    handler: async (args: { path: string }) => {
      try {
        await git.raw(['worktree', 'remove', args.path]);
        return {
          content: [{ type: "text", text: `Worktree at '${args.path}' removed successfully` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Remove worktree error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  commit_changes: {
    schema: commitChangesSchema,
    handler: async (args: { message: string; files?: string[] }) => {
      try {
        if (args.files && args.files.length > 0) {
          await git.add(args.files);
        } else {
          await git.add('.');
        }
        const result = await git.commit(args.message);
        return {
          content: [{ type: "text", text: `Changes committed: ${result.commit}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Commit error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  push_changes: {
    schema: pushChangesSchema,
    handler: async (args: { remote?: string; branch?: string }) => {
      try {
        const remote = args.remote || 'origin';
        if (args.branch) {
          await git.push(remote, args.branch);
        } else {
          await git.push();
        }
        return {
          content: [{ type: "text", text: `Changes pushed to ${remote}${args.branch ? `/${args.branch}` : ''}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Push error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  pull_changes: {
    schema: pullChangesSchema,
    handler: async (args: { remote?: string; branch?: string }) => {
      try {
        const remote = args.remote || 'origin';
        if (args.branch) {
          await git.pull(remote, args.branch);
        } else {
          await git.pull();
        }
        return {
          content: [{ type: "text", text: `Changes pulled from ${remote}${args.branch ? `/${args.branch}` : ''}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Pull error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  },

  git_diff: {
    schema: gitDiffSchema,
    handler: async (args: { repo_path: string; source?: string; target?: string; files?: string[] }) => {
      try {
        const gitInstance = simpleGit(args.repo_path);
        let diffArgs: string[] = [];
        if (args.source) {
          diffArgs.push(args.source);
        }
        if (args.target) {
          diffArgs.push(args.target);
        }
        if (args.files && args.files.length > 0) {
          diffArgs.push('--');
          diffArgs.push(...args.files);
        }
        const diff = await gitInstance.diff(diffArgs);
        return {
          content: [{ type: "text", text: diff || "No differences found" }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Git diff error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }
  }
};

// Simple MCP server implementation using stdio
async function handleMessage(message: any) {
  const { id, method, params } = message;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'git-server', version: '0.1.0' }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: Object.entries(tools).map(([name, tool]) => ({
              name,
              description: `${name.replace('_', ' ').toUpperCase()} - Git operation`,
              inputSchema: {
                type: 'object',
                properties: tool.schema.shape,
                required: Object.keys(tool.schema.shape)
              }
            }))
          }
        };

      case 'tools/call':
        const { name, arguments: args = {} } = params;
        if (!tools[name as keyof typeof tools]) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const tool = tools[name as keyof typeof tools];
        tool.schema.parse(args);
        const result = await tool.handler(args);

        return {
          jsonrpc: '2.0',
          id,
          result
        };

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: (error as Error).message
      }
    };
  }
}

// Main server loop
async function main() {
  const stdin = process.stdin;
  const stdout = process.stdout;

  let buffer = '';

  stdin.on('data', async (chunk) => {
    buffer += chunk.toString();

    const messages = buffer.split('\n');
    buffer = messages.pop() || '';

    for (const message of messages) {
      if (message.trim()) {
        try {
          const parsed = JSON.parse(message);
          const response = await handleMessage(parsed);
          stdout.write(JSON.stringify(response) + '\n');
        } catch (error) {
          stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' }
          }) + '\n');
        }
      }
    }
  });

  console.error('Git MCP server running on stdio');
}

main().catch(console.error);