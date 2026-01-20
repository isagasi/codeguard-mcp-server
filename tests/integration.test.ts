/**
 * Simple test client for the CodeGuard MCP Server
 * This demonstrates how to interact with the server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testServer() {
  console.log('Starting CodeGuard MCP Server test...\n');

  // Start the server process
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  // Create client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to server\n');

    // Test 1: List resources
    console.log('📋 Test 1: Listing available resources...');
    const resources = await client.listResources();
    console.log(`Found ${resources.resources.length} resources:`);
    resources.resources.forEach((r) => {
      console.log(`  - ${r.name} (${r.uri})`);
    });
    console.log();

    // Test 2: Get Python instructions
    console.log('🐍 Test 2: Getting Python security instructions...');
    const pythonResource = await client.readResource({
      uri: 'codeguard://instructions/python',
    });
    if (pythonResource.contents && pythonResource.contents.length > 0) {
      const pythonContent = pythonResource.contents[0];
      const textLength = (pythonContent as any).text?.length || 0;
      console.log(`Retrieved ${textLength} characters of Python instructions`);
    }
    console.log();

    // Test 3: List prompts
    console.log('💬 Test 3: Listing available prompts...');
    const prompts = await client.listPrompts();
    console.log(`Found ${prompts.prompts.length} prompts:`);
    prompts.prompts.forEach((p) => {
      console.log(`  - ${p.name}: ${p.description}`);
    });
    console.log();

    // Test 4: Get security instructions for Python + crypto
    console.log('🔐 Test 4: Getting instructions for Python crypto code...');
    const prompt = await client.getPrompt({
      name: 'get_security_instructions',
      arguments: {
        language: 'python',
        context: 'hash password crypto',
      },
    });
    console.log(`Received instruction prompt with ${prompt.messages?.length || 0} messages`);
    if (prompt.messages && prompt.messages.length > 0) {
      const content = prompt.messages[0].content;
      if (typeof content === 'object' && 'text' in content) {
        console.log(`Content length: ${content.text.length} characters`);
        console.log(`First 200 chars:\n${content.text.substring(0, 200)}...`);
      }
    }
    console.log();

    // Test 5: Get instructions for a specific file
    console.log('📄 Test 5: Getting instructions for src/auth/login.ts...');
    const fileResource = await client.readResource({
      uri: 'codeguard://instructions/file?path=src/auth/login.ts',
    });
    if (fileResource.contents && fileResource.contents.length > 0) {
      const fileContent = fileResource.contents[0];
      const textLength = (fileContent as any).text?.length || 0;
      console.log(`Retrieved ${textLength} characters of instructions`);
    }
    console.log();

    // Test 6: List available tools
    console.log('🔧 Test 6: Listing available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    tools.tools.forEach((t) => {
      console.log(`  - ${t.name}: ${t.description}`);
    });
    console.log();

    // Test 7: Call get_security_instructions tool
    console.log('⚙️ Test 7: Calling get_security_instructions tool...');
    const toolResult = await client.callTool({
      name: 'get_security_instructions',
      arguments: {
        language: 'python',
        context: 'password hashing',
      },
    });
    if (toolResult.content && toolResult.content.length > 0) {
      const toolText = (toolResult.content[0] as any).text;
      console.log(`Tool returned ${toolText?.length || 0} characters`);
      if (toolText && (toolText.includes('bcrypt') || toolText.includes('Argon2'))) {
        console.log('✅ Tool response includes expected security rules!');
      }
    }
    console.log();

    console.log('✅ All tests passed!');

    // Close connection
    await client.close();
    serverProcess.kill();
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.log(error.stack);
    }
    serverProcess.kill();
    process.exit(1);
  }
}

// Run tests
testServer();
