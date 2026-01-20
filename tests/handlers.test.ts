/**
 * Tests for MCP handlers
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { listResources, readResource } from '../src/handlers/resources.js';
import { listPrompts, getPrompt } from '../src/handlers/prompts.js';
import { listTools, callTool } from '../src/handlers/tools.js';
import { loadInstructions } from '../src/rules/loader.js';
import type { Instruction } from '../src/rules/types.js';
import * as path from 'path';

describe('Resource Handlers', () => {
  let instructions: Instruction[];

  beforeAll(async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    instructions = await loadInstructions(rulesDir);
  });

  it('should list all available resources', () => {
    const result = listResources();
    
    expect(result.resources).toBeDefined();
    expect(result.resources.length).toBeGreaterThan(0);
    expect(result.resources[0]).toHaveProperty('uri');
    expect(result.resources[0]).toHaveProperty('name');
    expect(result.resources[0]).toHaveProperty('description');
  });

  it('should read all instructions resource', () => {
    const result = readResource('codeguard://instructions/all', instructions);
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
    expect(result.contents![0]).toHaveProperty('text');
    expect(result.contents![0].text).toContain('codeguard');
  });

  it('should read Python instructions', () => {
    const result = readResource('codeguard://instructions/python', instructions);
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
    expect(result.contents![0].text!.length).toBeGreaterThan(0);
  });

  it('should read JavaScript instructions', () => {
    const result = readResource('codeguard://instructions/javascript', instructions);
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
  });

  it('should read TypeScript instructions', () => {
    const result = readResource('codeguard://instructions/typescript', instructions);
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
  });

  it('should read file-specific instructions', () => {
    const result = readResource(
      'codeguard://instructions/file?path=src/auth/login.ts',
      instructions
    );
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
  });

  it('should handle missing path parameter', () => {
    const result = readResource('codeguard://instructions/file', instructions);
    
    expect(result).toHaveProperty('error');
  });

  it('should handle unknown resource URIs', () => {
    const result = readResource('codeguard://invalid-path/test', instructions);
    
    expect(result.contents).toBeDefined();
    expect(result.contents!.length).toBeGreaterThan(0);
    expect(result.contents![0].text).toContain('Unknown resource');
  });
});

describe('Prompt Handlers', () => {
  let instructions: Instruction[];

  beforeAll(async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    instructions = await loadInstructions(rulesDir);
  });

  it('should list available prompts', () => {
    const result = listPrompts();
    
    expect(result.prompts).toBeDefined();
    expect(result.prompts.length).toBeGreaterThan(0);
    expect(result.prompts[0]).toHaveProperty('name');
    expect(result.prompts[0]).toHaveProperty('description');
  });

  it('should get security instructions prompt with language', () => {
    const result = getPrompt(
      'get_security_instructions',
      { language: 'python' },
      instructions
    );
    
    expect(result.messages).toBeDefined();
    expect(result.messages!.length).toBeGreaterThan(0);
  });

  it('should get security instructions prompt with context', () => {
    const result = getPrompt(
      'get_security_instructions',
      { context: 'password hashing crypto' },
      instructions
    );
    
    expect(result.messages).toBeDefined();
    expect(result.messages!.length).toBeGreaterThan(0);
  });

  it('should get security instructions prompt with filepath', () => {
    const result = getPrompt(
      'get_security_instructions',
      { filepath: 'src/auth.py' },
      instructions
    );
    
    expect(result.messages).toBeDefined();
    expect(result.messages!.length).toBeGreaterThan(0);
  });

  it('should handle unknown prompt name', () => {
    const result = getPrompt(
      'unknown_prompt',
      {},
      instructions
    );
    
    expect(result).toHaveProperty('description');
    expect(result.description).toContain('Unknown');
  });

  it('should handle empty arguments', () => {
    const result = getPrompt(
      'get_security_instructions',
      {},
      instructions
    );
    
    expect(result.messages).toBeDefined();
    // Should still return critical rules
    expect(result.messages!.length).toBeGreaterThan(0);
  });
});

describe('Tool Handlers', () => {
  let instructions: Instruction[];

  beforeAll(async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    instructions = await loadInstructions(rulesDir);
  });

  it('should list available tools', () => {
    const result = listTools();
    
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools[0]).toHaveProperty('name');
    expect(result.tools[0]).toHaveProperty('description');
    expect(result.tools[0]).toHaveProperty('inputSchema');
  });

  it('should call get_security_instructions tool', () => {
    const result = callTool(
      'get_security_instructions',
      { language: 'python', context: 'password' },
      instructions
    );
    
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0]).toHaveProperty('type');
    expect(result.content[0]).toHaveProperty('text');
  });

  it('should call validate_code_security tool', () => {
    const result = callTool(
      'validate_code_security',
      { code: 'import hashlib', language: 'python' },
      instructions
    );
    
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('should handle unknown tool', () => {
    const result = callTool(
      'unknown_tool',
      {},
      instructions
    );
    
    expect(result.content).toBeDefined();
    expect(result.isError).toBe(true);
  });

  it('should validate code with crypto algorithms', () => {
    const result = callTool(
      'validate_code_security',
      { 
        code: 'password_hash = hashlib.md5(password).hexdigest()',
        language: 'python'
      },
      instructions
    );
    
    expect(result.content).toBeDefined();
    const text = result.content[0].text;
    expect(text).toContain('crypto'); // Should include crypto rules
  });
});
