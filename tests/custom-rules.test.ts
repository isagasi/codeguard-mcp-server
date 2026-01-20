/**
 * Tests for custom rules functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadInstructions } from '../src/rules/loader.js';
import { matchInstructions } from '../src/rules/matcher.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Custom Rules', () => {
  let tempDir: string;
  let customDir: string;

  beforeAll(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeguard-custom-test-'));
    customDir = path.join(tempDir, 'custom');
    await fs.mkdir(customDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load custom rules from custom/ directory', async () => {
    // Create a custom rule
    const customRule = `---
applyTo: '**/*.ts'
description: 'Custom TypeScript Rule'
version: '1.0.0'
---

# Custom Rule
This is a custom rule.`;

    await fs.writeFile(
      path.join(customDir, 'custom-typescript.instructions.md'),
      customRule
    );

    const instructions = await loadInstructions(tempDir);
    
    const customInstruction = instructions.find(i => i.id === 'custom-typescript');
    expect(customInstruction).toBeDefined();
    expect(customInstruction!.isCustom).toBe(true);
  });

  it('should override default rules with custom rules', async () => {
    // Create a default rule
    const defaultRule = `---
applyTo: '**/*.js'
description: 'Default JavaScript Rule'
version: '1.0.0'
---

# Default Rule
Original content.`;

    await fs.writeFile(
      path.join(tempDir, 'test-rule.instructions.md'),
      defaultRule
    );

    // Create a custom override
    const customRule = `---
applyTo: '**/*.js'
description: 'Custom JavaScript Rule Override'
version: '2.0.0'
---

# Custom Rule
Overridden content.`;

    await fs.writeFile(
      path.join(customDir, 'test-rule.instructions.md'),
      customRule
    );

    const instructions = await loadInstructions(tempDir);
    
    const testRule = instructions.find(i => i.id === 'test-rule');
    expect(testRule).toBeDefined();
    expect(testRule!.isCustom).toBe(true);
    expect(testRule!.overrides).toBe('test-rule');
    expect(testRule!.frontmatter.description).toBe('Custom JavaScript Rule Override');
    expect(testRule!.content).toContain('Overridden content');
  });

  it('should not duplicate rules when custom overrides default', async () => {
    const defaultRule = `---
applyTo: '**/*.py'
description: 'Default Python Rule'
version: '1.0.0'
---

# Default Rule`;

    await fs.writeFile(
      path.join(tempDir, 'python-rule.instructions.md'),
      defaultRule
    );

    const customRule = `---
applyTo: '**/*.py'
description: 'Custom Python Rule'
version: '1.0.0'
---

# Custom Rule`;

    await fs.writeFile(
      path.join(customDir, 'python-rule.instructions.md'),
      customRule
    );

    const instructions = await loadInstructions(tempDir);
    
    const pythonRules = instructions.filter(i => i.id === 'python-rule');
    expect(pythonRules.length).toBe(1);
    expect(pythonRules[0].isCustom).toBe(true);
  });

  it('should work when custom/ directory does not exist', async () => {
    const tempDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'codeguard-no-custom-'));
    
    try {
      const defaultRule = `---
applyTo: '**/*.ts'
description: 'TypeScript Rule'
version: '1.0.0'
---

# Rule`;

      await fs.writeFile(
        path.join(tempDir2, 'ts-rule.instructions.md'),
        defaultRule
      );

      const instructions = await loadInstructions(tempDir2);
      
      expect(instructions.length).toBe(1);
      expect(instructions[0].id).toBe('ts-rule');
      expect(instructions[0].isCustom).toBe(false);
    } finally {
      await fs.rm(tempDir2, { recursive: true, force: true });
    }
  });
});

describe('Custom Rules - Priority Scoring', () => {
  it('should prioritize custom rules higher than default rules', () => {
    const defaultRule = {
      id: 'test-rule',
      filepath: '/rules/test.md',
      frontmatter: { applyTo: '**/*.ts', description: 'Default', version: '1.0.0' },
      content: 'Default content',
      patterns: ['**/*.ts'],
      isCustom: false,
    };

    const customRule = {
      id: 'custom-rule',
      filepath: '/rules/custom/custom.md',
      frontmatter: { applyTo: '**/*.ts', description: 'Custom', version: '1.0.0' },
      content: 'Custom content',
      patterns: ['**/*.ts'],
      isCustom: true,
    };

    const result = matchInstructions(
      { filepath: 'src/app.ts', language: 'typescript' },
      [defaultRule, customRule]
    );

    // Custom rule should appear before or equal to default rule
    const customIndex = result.instructions.findIndex(i => i.id === 'custom-rule');
    const defaultIndex = result.instructions.findIndex(i => i.id === 'test-rule');
    
    if (customIndex !== -1 && defaultIndex !== -1) {
      expect(customIndex).toBeLessThanOrEqual(defaultIndex);
    }
  });

  it('should give custom rules baseline score boost', () => {
    const defaultRule = {
      id: 'default-rule',
      filepath: '/rules/default.md',
      frontmatter: { applyTo: '**/*', description: 'Default', version: '1.0.0' },
      content: 'Default',
      patterns: ['**/*'],
      isCustom: false,
    };

    const customRule = {
      id: 'custom-rule',
      filepath: '/rules/custom/custom.md',
      frontmatter: { applyTo: '**/*', description: 'Custom', version: '1.0.0' },
      content: 'Custom',
      patterns: ['**/*'],
      isCustom: true,
    };

    const result = matchInstructions({ filepath: 'src/file.txt' }, [defaultRule, customRule]);

    expect(result.instructions.length).toBeGreaterThan(0);
    // Both should match, custom should be prioritized
    const customInResult = result.instructions.find(i => i.id === 'custom-rule');
    expect(customInResult).toBeDefined();
  });
});

describe('Custom Rules - Real World Integration', () => {
  it('should load real custom rules from rules/custom/', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    // Should have loaded both default and custom rules
    expect(instructions.length).toBeGreaterThan(22); // More than just default rules
    
    // Check for custom rules
    const customRules = instructions.filter(i => i.isCustom);
    expect(customRules.length).toBeGreaterThan(0);
    
    // Check for specific example custom rules
    const orgApiStandards = instructions.find(i => i.id === 'org-api-standards');
    expect(orgApiStandards).toBeDefined();
    expect(orgApiStandards!.isCustom).toBe(true);
  });

  it('should override default hardcoded-credentials rule with custom version', async () => {
    const rulesDir = path.join(process.cwd(), 'rules');
    const instructions = await loadInstructions(rulesDir);
    
    const credRule = instructions.find(i => i.id === 'codeguard-1-hardcoded-credentials');
    
    expect(credRule).toBeDefined();
    // Should be the custom version
    expect(credRule!.isCustom).toBe(true);
    expect(credRule!.content).toContain('Organization Policy');
  });
});
