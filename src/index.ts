#!/usr/bin/env node

/**
 * CodeGuard MCP Server
 * Centralized security instruction server for AI-assisted code generation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { loadInstructions } from './rules/loader.js';
import { listResources, readResource } from './handlers/resources.js';
import { listPrompts, getPrompt } from './handlers/prompts.js';
import { listTools, callTool } from './handlers/tools.js';
import type { Instruction } from './rules/types.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File-based logging for tracing
const LOG_FILE = path.join(__dirname, '..', 'mcp-trace.log');
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.error(logMessage.trim()); // Also log to stderr
}

// Global state
let instructions: Instruction[] = [];

/**
 * Initialize the server
 */
async function initializeServer() {
  // Load instruction files
  const rulesDir = path.join(__dirname, '..', 'rules');
  logToFile(`SERVER STARTING - Loading instructions from: ${rulesDir}`);
  
  instructions = await loadInstructions(rulesDir);
  logToFile(`SERVER READY - Loaded ${instructions.length} instruction files`);
  
  if (instructions.length === 0) {
    logToFile('WARNING: No instruction files loaded!');
  }
}

/**
 * Create and configure the MCP server
 */
async function createServer() {
  const server = new Server(
    {
      name: 'codeguard-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        prompts: {},
        tools: {},
      },
    }
  );

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logToFile('[MCP] ListResources called');
    return listResources();
  });

  // Read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    logToFile(`[MCP] ReadResource called: ${uri}`);
    const result = readResource(uri, instructions);
    logToFile(`[MCP] ReadResource result: ${JSON.stringify(result).substring(0, 200)}`);
    return result;
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logToFile('[MCP] ListPrompts called');
    return listPrompts();
  });

  // Get a specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    logToFile(`[MCP] GetPrompt called: ${name} with args: ${JSON.stringify(args)}`);
    return getPrompt(name, args, instructions);
  });
// List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logToFile('[MCP] ListTools called');
    return listTools();
  });

  // Call a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    logToFile(`[MCP] CallTool: ${name} with args: ${JSON.stringify(args)}`);
    return callTool(name, args, instructions);
  });

  
  return server;
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Initialize
    await initializeServer();
    
    // Create server
    const server = await createServer();
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('CodeGuard MCP Server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main();
