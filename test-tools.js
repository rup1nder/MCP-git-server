// Test script for Git MCP server tools
import simpleGit from 'simple-git';

const REPO_PATH = process.env.GIT_REPO_PATH || '/Users/rupindersingh/code/encryptdecrypt2';
const git = simpleGit(REPO_PATH);

// Import MCP SDK
const { Server } = await import('./node_modules/@modelcontextprotocol/sdk/dist/server/index.js');
const { StdioServerTransport } = await import('./node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js');

// Define available tools
const tools = [
  {
    name: "git_status",
    description: "Get the current Git repository status",
    inputSchema: {
      type: "object",
      properties: {},
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
];

// Tool execution handler
async function executeTool(name, args) {
  switch (name) {
    case "git_status":
      try {
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

    case "list_branches":
      try {
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

    case "create_branch":
      try {
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

    case "create_worktree":
      try {
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

// Test the tools
async function testTools() {
  console.log('🧪 Testing Git MCP Server Tools...\n');

  // Test git_status
  console.log('📊 Testing git_status tool:');
  const statusResult = await executeTool('git_status', {});
  console.log('Result:', statusResult.content[0].text);
  console.log('');

  // Test list_branches
  console.log('🌿 Testing list_branches tool:');
  const branchesResult = await executeTool('list_branches', {});
  console.log('Result:', branchesResult.content[0].text);
  console.log('');

  // Test create_branch
  console.log('🌱 Testing create_branch tool:');
  const branchResult = await executeTool('create_branch', { branchName: 'test-feature' });
  console.log('Result:', branchResult.content[0].text);
  console.log('');

  // Test list_branches again to see the new branch
  console.log('🌿 Testing list_branches after creating new branch:');
  const branchesAfterResult = await executeTool('list_branches', {});
  console.log('Result:', branchesAfterResult.content[0].text);
  console.log('');

  // Test create_worktree
  console.log('🏗️ Testing create_worktree tool:');
  const worktreeResult = await executeTool('create_worktree', {
    path: '/tmp/test-worktree',
    branch: 'test-worktree-branch'
  });
  console.log('Result:', worktreeResult.content[0].text);
  console.log('');

  // Test list_worktrees
  console.log('📋 Testing list_worktrees tool:');
  const worktreesResult = await executeTool('list_worktrees', {});
  console.log('Result:', worktreesResult.content[0].text);
  console.log('');

  console.log('✅ Tool testing completed!');
}

testTools().catch(console.error);