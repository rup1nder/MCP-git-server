# Git MCP Server

A Model Context Protocol (MCP) server that provides comprehensive Git operations for AI assistants, with special focus on parallel development workflows using Git worktrees.

## 🚀 Features

### Core Git Operations
- **Repository Status**: Get detailed repository status with file information
- **Branch Management**: Create, switch, merge, and list branches
- **Worktree Operations**: Create and manage Git worktrees for parallel development
- **File Operations**: Stage, commit, push, and pull changes
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Advanced Features
- **Parallel Development**: Full support for Git worktree-based workflows
- **AI-Assisted Operations**: Intelligent suggestions and safety checks
- **Repository Flexibility**: Configurable repository paths via environment variables
- **Production Ready**: 100% test coverage with comprehensive test suite

## 📋 Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `git_status` | Get repository status | None |
| `create_branch` | Create new branch | `branchName`, `fromBranch` (optional) |
| `switch_branch` | Switch to branch | `branchName` |
| `list_branches` | List all branches | None |
| `merge_branch` | Merge branches | `sourceBranch`, `targetBranch` (optional) |
| `create_worktree` | Create Git worktree | `path`, `branch` (optional) |
| `list_worktrees` | List worktrees | None |
| `remove_worktree` | Remove worktree | `path` |
| `commit_changes` | Commit changes | `message`, `files` (optional) |
| `push_changes` | Push to remote | `remote` (optional), `branch` (optional) |
| `pull_changes` | Pull from remote | `remote` (optional), `branch` (optional) |

## 🛠️ Installation

### Prerequisites
- Node.js v18+ with ES modules support
- Git repository to operate on
- Kilo Code extension for VSCode

### Setup Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Server**:
   ```bash
   npm run build
   ```

3. **Configure MCP Settings**:
   Add to your Kilo Code MCP settings (`mcp_settings.json`):
   ```json
   {
     "mcpServers": {
       "git-server": {
         "command": "node",
         "args": ["/path/to/git-server/build/index.js"],
         "env": {
           "GIT_REPO_PATH": "/path/to/your/repository"
         },
         "disabledTools": []
       }
     }
   }
   ```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test
```

Or run tests directly:
```bash
node tests/git-server.test.js
```

### Test Coverage
- ✅ MCP Protocol Compliance
- ✅ All Git Operations
- ✅ Error Scenarios
- ✅ Worktree Management
- ✅ Branch Operations
- ✅ Repository State Validation

## 📁 Project Structure

```
git-server/
├── 📄 package.json           # Project configuration
├── 📄 tsconfig.json          # TypeScript configuration
├── 📁 src/                   # Source code
│   └── 📄 index.ts          # Main server implementation
├── 📁 build/                 # Compiled JavaScript
├── 📁 tests/                 # Test files
│   ├── 📄 git-server.test.js # Comprehensive test suite
│   └── 📄 test-server.js     # Test utilities
├── 📄 README.md              # This documentation
└── 📄 .gitignore            # Git ignore rules
```

## ⚙️ Configuration

### Environment Variables
- `GIT_REPO_PATH`: Path to the Git repository (defaults to current directory)

### MCP Settings
The server integrates with Kilo Code's MCP system and will be automatically available in all your VSCode workspaces for the configured user account.

## 🔧 Development

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run test suite
- `npm start` - Start the compiled server

### Development Workflow
1. Make changes to `src/index.ts`
2. Run `npm run build` to compile
3. Test with `npm test`
4. Update MCP configuration if needed

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**
- Ensure Node.js v18+ is installed
- Check that `GIT_REPO_PATH` points to a valid Git repository
- Verify MCP settings are correctly configured

**Git operations fail:**
- Confirm the repository exists and is accessible
- Check Git permissions
- Ensure no conflicting operations are in progress

**Tests fail:**
- Clean up test artifacts: `git worktree prune`
- Remove test branches: `git branch -D test-*`
- Ensure repository is in clean state

## 🤝 Contributing

This MCP server is designed to be:
- **Extensible**: Easy to add new Git operations
- **Testable**: Comprehensive test coverage
- **Maintainable**: Clean code structure and documentation

## 📄 License

This project is part of the Git MCP Server implementation for enhanced AI-assisted Git workflows.

---

**🎉 Ready for AI-Assisted Git Operations!**

This server transforms how AI assistants interact with Git, providing intelligent, safe, and comprehensive version control operations with special support for parallel development workflows.