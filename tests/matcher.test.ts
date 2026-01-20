/**
 * Tests for pattern matcher
 */

import { describe, it, expect } from 'vitest';
import { matchInstructions, detectLanguageFromPath, getLanguageExtensions } from '../src/rules/matcher.js';
import type { Instruction } from '../src/rules/types.js';
import { RulePriority } from '../src/rules/types.js';

describe('Pattern Matcher', () => {
  const mockInstructions: Instruction[] = [
    {
      id: 'codeguard-1-hardcoded-credentials',
      filepath: '/rules/codeguard-1-hardcoded-credentials.instructions.md',
      frontmatter: {
        applyTo: '**/*',
        description: 'No Hardcoded Credentials',
        version: '1.0.0',
      },
      content: '# No Hardcoded Credentials',
      patterns: ['**/*'],
    },
    {
      id: 'test-python-rule',
      filepath: '/rules/test-python-rule.instructions.md',
      frontmatter: {
        applyTo: '**/*.py',
        description: 'Python Test Rule',
        version: '1.0.0',
      },
      content: '# Python Rule',
      patterns: ['**/*.py'],
    },
    {
      id: 'test-auth-rule',
      filepath: '/rules/test-auth-rule.instructions.md',
      frontmatter: {
        applyTo: '**/auth/**',
        description: 'Auth Rule',
        version: '1.0.0',
      },
      content: '# Auth Rule',
      patterns: ['**/auth/**'],
    },
  ];

  it('should match by file path', () => {
    const result = matchInstructions(
      { filepath: 'src/main.py' },
      mockInstructions
    );
    
    expect(result.instructions.length).toBeGreaterThan(0);
    const pythonRule = result.instructions.find(i => i.id === 'test-python-rule');
    expect(pythonRule).toBeDefined();
  });

  it('should match by language', () => {
    const result = matchInstructions(
      { language: 'python' },
      mockInstructions
    );
    
    const pythonRule = result.instructions.find(i => i.id === 'test-python-rule');
    expect(pythonRule).toBeDefined();
  });

  it('should always include critical rules', () => {
    const result = matchInstructions(
      { language: 'javascript' },
      mockInstructions
    );
    
    const credentialRule = result.instructions.find(
      i => i.id === 'codeguard-1-hardcoded-credentials'
    );
    expect(credentialRule).toBeDefined();
  });

  it('should provide match metadata', () => {
    const result = matchInstructions(
      { filepath: 'src/auth.py', language: 'python' },
      mockInstructions
    );
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata.totalMatched).toBeGreaterThan(0);
    expect(result.metadata.matchedBy).toBeDefined();
  });

  it('should match complex file patterns', () => {
    const result = matchInstructions(
      { filepath: 'src/auth/login.py' },
      mockInstructions
    );
    
    const authRule = result.instructions.find(i => i.id === 'test-auth-rule');
    expect(authRule).toBeDefined();
  });

  it('should match by context keywords', () => {
    const result = matchInstructions(
      { context: 'authentication login password' },
      mockInstructions
    );
    
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  it('should deduplicate matched rules', () => {
    const result = matchInstructions(
      { filepath: 'src/auth/main.py', language: 'python', context: 'auth' },
      mockInstructions
    );
    
    const ruleIds = result.instructions.map(i => i.id);
    const uniqueIds = new Set(ruleIds);
    expect(ruleIds.length).toBe(uniqueIds.size);
  });

  it('should handle empty context', () => {
    const result = matchInstructions({}, mockInstructions);
    
    expect(result.instructions.length).toBeGreaterThan(0);
    // Should at least include critical rules
    const credentialRule = result.instructions.find(
      i => i.id === 'codeguard-1-hardcoded-credentials'
    );
    expect(credentialRule).toBeDefined();
  });

  it('should match multiple languages', () => {
    const jsResult = matchInstructions({ language: 'javascript' }, mockInstructions);
    const pyResult = matchInstructions({ language: 'python' }, mockInstructions);
    
    expect(jsResult.instructions.length).toBeGreaterThan(0);
    expect(pyResult.instructions.length).toBeGreaterThan(0);
  });

  it('should provide accurate match counts', () => {
    const result = matchInstructions(
      { filepath: 'src/main.py', language: 'python' },
      mockInstructions
    );
    
    expect(result.metadata.totalMatched).toBeGreaterThanOrEqual(result.instructions.length);
  });
});

describe('Phase 2: Language Detection', () => {
  it('should detect language from file extension', () => {
    expect(detectLanguageFromPath('src/app.py')).toBe('python');
    expect(detectLanguageFromPath('src/App.tsx')).toBe('typescript');
    expect(detectLanguageFromPath('server.js')).toBe('javascript');
    expect(detectLanguageFromPath('main.go')).toBe('go');
    expect(detectLanguageFromPath('script.sh')).toBe('shell');
  });

  it('should detect Dockerfile', () => {
    expect(detectLanguageFromPath('Dockerfile')).toBe('dockerfile');
    expect(detectLanguageFromPath('Dockerfile.prod')).toBe('dockerfile');
  });

  it('should return undefined for unknown extensions', () => {
    expect(detectLanguageFromPath('README.txt')).toBeUndefined();
    expect(detectLanguageFromPath('file')).toBeUndefined();
  });

  it('should get language extensions', () => {
    const pyExts = getLanguageExtensions('python');
    expect(pyExts).toContain('.py');
    expect(pyExts).toContain('.pyi');
    
    const jsExts = getLanguageExtensions('javascript');
    expect(jsExts).toContain('.js');
    expect(jsExts).toContain('.mjs');
  });

  it('should auto-detect language from filepath in matching', () => {
    const mockRules: Instruction[] = [
      {
        id: 'python-rule',
        filepath: '/rules/python.md',
        frontmatter: { applyTo: '**/*.py', description: 'Python', version: '1.0.0' },
        content: 'Python rules',
        patterns: ['**/*.py'],
      },
    ];

    // No language specified, but filepath has .py extension
    const result = matchInstructions({ filepath: 'src/app.py' }, mockRules);
    const pythonRule = result.instructions.find(i => i.id === 'python-rule');
    expect(pythonRule).toBeDefined();
  });
});

describe('Phase 2: Context Scoring', () => {
  const mockRules: Instruction[] = [
    {
      id: 'codeguard-1-hardcoded-credentials',
      filepath: '/rules/creds.md',
      frontmatter: { applyTo: '**/*', description: 'Credentials', version: '1.0.0' },
      content: 'No hardcoded credentials',
      patterns: ['**/*'],
    },
    {
      id: 'codeguard-0-authentication-mfa',
      filepath: '/rules/auth.md',
      frontmatter: { applyTo: '**/*', description: 'Auth', version: '1.0.0' },
      content: 'Authentication rules',
      patterns: ['**/*'],
    },
    {
      id: 'codeguard-1-crypto-algorithms',
      filepath: '/rules/crypto.md',
      frontmatter: { applyTo: '**/*', description: 'Crypto', version: '1.0.0' },
      content: 'Crypto rules',
      patterns: ['**/*'],
    },
  ];

  it('should match context keywords', () => {
    const result = matchInstructions({ context: 'authentication password' }, mockRules);
    
    const authRule = result.instructions.find(i => i.id === 'codeguard-0-authentication-mfa');
    expect(authRule).toBeDefined();
  });

  it('should match crypto context', () => {
    const result = matchInstructions({ context: 'hash encrypt' }, mockRules);
    
    const cryptoRule = result.instructions.find(i => i.id === 'codeguard-1-crypto-algorithms');
    expect(cryptoRule).toBeDefined();
  });

  it('should score exact keyword matches higher', () => {
    const result = matchInstructions({ context: 'crypto cryptography' }, mockRules);
    
    // Should prioritize rules with exact matches
    expect(result.instructions.length).toBeGreaterThan(0);
  });
});

describe('Phase 2: Rule Prioritization', () => {
  const mockRules: Instruction[] = [
    {
      id: 'codeguard-1-hardcoded-credentials',
      filepath: '/rules/creds.md',
      frontmatter: { applyTo: '**/*', description: 'Critical', version: '1.0.0' },
      content: 'Critical rule',
      patterns: ['**/*'],
    },
    {
      id: 'general-rule',
      filepath: '/rules/general.md',
      frontmatter: { applyTo: '**/*.js', description: 'General', version: '1.0.0' },
      content: 'General rule',
      patterns: ['**/*.js'],
    },
    {
      id: 'specific-rule',
      filepath: '/rules/specific.md',
      frontmatter: { applyTo: '**/*.py', description: 'Specific', version: '1.0.0' },
      content: 'Specific rule',
      patterns: ['**/*.py'],
    },
  ];

  it('should prioritize critical rules first', () => {
    const result = matchInstructions({ language: 'javascript' }, mockRules);
    
    // Critical rule should be first (or at least included)
    const firstRule = result.instructions[0];
    expect(firstRule.id).toBe('codeguard-1-hardcoded-credentials');
  });

  it('should include priority breakdown in metadata', () => {
    const result = matchInstructions({ language: 'python' }, mockRules);
    
    expect(result.metadata.priorityBreakdown).toBeDefined();
    expect(result.metadata.priorityBreakdown!.critical).toBeGreaterThan(0);
  });

  it('should limit response size to top 15 rules', () => {
    // Create 20 mock rules
    const manyRules: Instruction[] = [];
    for (let i = 0; i < 20; i++) {
      manyRules.push({
        id: `rule-${i}`,
        filepath: `/rules/rule-${i}.md`,
        frontmatter: { applyTo: '**/*', description: `Rule ${i}`, version: '1.0.0' },
        content: `Rule ${i} content`,
        patterns: ['**/*'],
      });
    }
    
    const result = matchInstructions({}, manyRules);
    expect(result.instructions.length).toBeLessThanOrEqual(15);
  });

  it('should sort by priority then score', () => {
    const result = matchInstructions(
      { filepath: 'src/app.py', language: 'python', context: 'auth' },
      mockRules
    );
    
    // First rule should be critical
    expect(result.instructions[0].id).toBe('codeguard-1-hardcoded-credentials');
  });
});

describe('Phase 2: Advanced Pattern Matching', () => {
  it('should support negative patterns', () => {
    const mockRules: Instruction[] = [
      {
        id: 'test-rule',
        filepath: '/rules/test.md',
        frontmatter: { applyTo: '!**/node_modules/**', description: 'Test', version: '1.0.0' },
        content: 'Test rule',
        patterns: ['!**/node_modules/**'],
      },
    ];
    
    // File in node_modules should NOT match
    const result = matchInstructions({ filepath: 'node_modules/lib/index.js' }, mockRules);
    const testRule = result.instructions.find(i => i.id === 'test-rule');
    expect(testRule).toBeUndefined();
  });

  it('should handle complex glob patterns', () => {
    const mockRules: Instruction[] = [
      {
        id: 'auth-rule',
        filepath: '/rules/auth.md',
        frontmatter: { applyTo: '**/auth/**/*.{js,ts}', description: 'Auth', version: '1.0.0' },
        content: 'Auth rule',
        patterns: ['**/auth/**/*.js', '**/auth/**/*.ts'],
      },
    ];
    
    const result = matchInstructions({ filepath: 'src/auth/login.ts' }, mockRules);
    const authRule = result.instructions.find(i => i.id === 'auth-rule');
    expect(authRule).toBeDefined();
  });
});
