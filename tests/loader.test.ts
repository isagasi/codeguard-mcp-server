/**
 * Tests for rule loader
 */

import { describe, it, expect } from 'vitest';
import { loadInstructions } from '../src/rules/loader.js';
import * as path from 'path';

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
    
    if (credentialRule) {
      expect(credentialRule.frontmatter.applyTo).toBeDefined();
      expect(credentialRule.frontmatter.description).toBeDefined();
      expect(credentialRule.frontmatter.version).toBeDefined();
      expect(credentialRule.patterns.length).toBeGreaterThan(0);
    }
  });

  it('should extract patterns from applyTo', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    instructions.forEach(instruction => {
      expect(instruction.patterns).toBeDefined();
      expect(Array.isArray(instruction.patterns)).toBe(true);
    });
  });
});
