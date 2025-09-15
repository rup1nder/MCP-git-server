#!/usr/bin/env node
const { Server } = await import("./node_modules/@modelcontextprotocol/sdk/dist/server/index.js");
const { StdioServerTransport } = await import("./node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js");
import { z } from "zod";
import simpleGit from 'simple-git';
// Default repository path - can be overridden via environment variable
const REPO_PATH = process.env.GIT_REPO_PATH || process.cwd();
// Initialize git instance
const git = simpleGit(REPO_PATH);
// Create an MCP server
const server = new Server({
    name: "git-server",
    version: "0.1.0"
});
// Tool: Get repository status
server.tool("git_status", {}, async () => {
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
    }
    catch (error) {
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
});
// Tool: Create a new branch
server.tool("create_branch", {
    branchName: z.string().describe("Name of the new branch"),
    fromBranch: z.string().optional().describe("Source branch to create from (defaults to current)"),
}, async ({ branchName, fromBranch }) => {
    try {
        if (fromBranch) {
            await git.checkoutBranch(branchName, fromBranch);
        }
        else {
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
    }
    catch (error) {
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
});
// Tool: Switch to a branch
server.tool("switch_branch", {
    branchName: z.string().describe("Name of the branch to switch to"),
}, async ({ branchName }) => {
    try {
        await git.checkout(branchName);
        return {
            content: [
                {
                    type: "text",
                    text: `Switched to branch '${branchName}'`,
                },
            ],
        };
    }
    catch (error) {
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
});
// Tool: List branches
server.tool("list_branches", {}, async () => {
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
    }
    catch (error) {
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
});
// Tool: Merge branches
server.tool("merge_branch", {
    sourceBranch: z.string().describe("Branch to merge from"),
    targetBranch: z.string().optional().describe("Branch to merge into (defaults to current)"),
}, async ({ sourceBranch, targetBranch }) => {
    try {
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
    }
    catch (error) {
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
});
// Tool: Create a worktree
server.tool("create_worktree", {
    path: z.string().describe("Path for the new worktree"),
    branch: z.string().optional().describe("Branch for the worktree (defaults to new branch with same name as path)"),
}, async ({ path, branch }) => {
    try {
        const worktreeBranch = branch || path.split('/').pop() || 'worktree-branch';
        await git.raw(['worktree', 'add', path, worktreeBranch]);
        return {
            content: [
                {
                    type: "text",
                    text: `Worktree created at '${path}' on branch '${worktreeBranch}'`,
                },
            ],
        };
    }
    catch (error) {
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
});
// Tool: List worktrees
server.tool("list_worktrees", {}, async () => {
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
    }
    catch (error) {
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
});
// Tool: Remove a worktree
server.tool("remove_worktree", {
    path: z.string().describe("Path of the worktree to remove"),
}, async ({ path }) => {
    try {
        await git.raw(['worktree', 'remove', path]);
        return {
            content: [
                {
                    type: "text",
                    text: `Worktree at '${path}' removed successfully`,
                },
            ],
        };
    }
    catch (error) {
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
});
// Tool: Commit changes
server.tool("commit_changes", {
    message: z.string().describe("Commit message"),
    files: z.array(z.string()).optional().describe("Specific files to commit (defaults to all)"),
}, async ({ message, files }) => {
    try {
        if (files && files.length > 0) {
            await git.add(files);
        }
        else {
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
    }
    catch (error) {
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
});
// Tool: Push changes
server.tool("push_changes", {
    remote: z.string().optional().describe("Remote name (defaults to 'origin')"),
    branch: z.string().optional().describe("Branch to push (defaults to current)"),
}, async ({ remote = 'origin', branch }) => {
    try {
        if (branch) {
            await git.push(remote, branch);
        }
        else {
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
    }
    catch (error) {
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
});
// Tool: Pull changes
server.tool("pull_changes", {
    remote: z.string().optional().describe("Remote name (defaults to 'origin')"),
    branch: z.string().optional().describe("Branch to pull (defaults to current)"),
}, async ({ remote = 'origin', branch }) => {
    try {
        if (branch) {
            await git.pull(remote, branch);
        }
        else {
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
    }
    catch (error) {
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
});
// Start receiving messages on stdin and sending messages on stdout
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Git MCP server running on stdio');
}
main().catch(console.error);
