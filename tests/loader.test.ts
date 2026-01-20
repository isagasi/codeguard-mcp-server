/**
 * Tests for rule loader
 */

import { describe, it, expect } from 'vitest';
import { loadInstructions } from '../src/rules/loader.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Rule Loader', () => {
  it('should load instruction files', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    expect(instructions).toBeDefined();
    expect(Array.isArray(instructions)).toBe(true);
    expect(instructions.length).toBeGreaterThan(0);
  });

  it('should parse frontmatter correctly', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    const credentialRule = instructions.find(i => 
      i.id === 'codeguard-1-hardcoded-credentials'
    );
    
    expect(credentialRule).toBeDefined();
    expect(credentialRule!.frontmatter.applyTo).toBeDefined();
    expect(credentialRule!.frontmatter.description).toBeDefined();
    expect(credentialRule!.frontmatter.version).toBeDefined();
    expect(credentialRule!.patterns.length).toBeGreaterThan(0);
  });

  it('should extract patterns from applyTo', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    instructions.forEach(instruction => {
      expect(instruction.patterns).toBeDefined();
      expect(Array.isArray(instruction.patterns)).toBe(true);
    });
  });

  it('should load all 22 instruction files', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    expect(instructions.length).toBe(22);
  });

  it('should set correct id from filename', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    const credentialRule = instructions.find(i => 
      i.id === 'codeguard-1-hardcoded-credentials'
    );
    
    expect(credentialRule).toBeDefined();
    expect(credentialRule!.id).toBe('codeguard-1-hardcoded-credentials');
  });

  it('should handle empty directory gracefully', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeguard-test-'));
    
    const instructions = await loadInstructions(tempDir);
    
    expect(instructions).toBeDefined();
    expect(Array.isArray(instructions)).toBe(true);
    expect(instructions.length).toBe(0);
    
    await fs.rm(tempDir, { recursive: true });
  });

  it('should split multiple patterns correctly', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    const pythonRule = instructions.find(i => 
      i.frontmatter.applyTo?.includes('**/*.py')
    );
    
    expect(pythonRule).toBeDefined();
    expect(pythonRule!.patterns.length).toBeGreaterThan(1);
  });

  it('should include full content for each instruction', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    instructions.forEach(instruction => {
      expect(instruction.content).toBeDefined();
      expect(instruction.content.length).toBeGreaterThan(0);
      expect(instruction.content).toContain('---'); // Has frontmatter
    });
  });
});
