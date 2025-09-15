// Simple test server to verify MCP SDK works
async function testServer() {
  try {
    console.log('Testing MCP SDK imports...');

    // Try importing the SDK directly from file path
    const serverModule = await import('./node_modules/@modelcontextprotocol/sdk/dist/server/index.js');
    const stdioModule = await import('./node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js');

    console.log('Server class:', serverModule.Server);
    console.log('StdioServerTransport class:', stdioModule.StdioServerTransport);

    console.log('✅ MCP SDK imports successful!');
  } catch (error) {
    console.error('❌ MCP SDK import failed:', error.message);
  }
}

testServer();