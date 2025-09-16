// Simple test server to verify MCP SDK works
async function testServer() {
  try {
    console.log('Testing MCP SDK imports...');

    // Try importing the SDK using package name
    const serverModule = await import('@modelcontextprotocol/sdk/server');
    const stdioModule = await import('@modelcontextprotocol/sdk/server/stdio');

    console.log('Server class:', serverModule.Server);
    console.log('StdioServerTransport class:', stdioModule.StdioServerTransport);

    console.log('✅ MCP SDK imports successful!');
  } catch (error) {
    console.error('❌ MCP SDK import failed:', error.message);
  }
}

testServer();