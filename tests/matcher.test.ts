/**
 * Tests for pattern matcher
 */

import { describe, it, expect } from 'vitest';
import { matchInstructions } from '../src/rules/matcher.js';
import type { Instruction } from '../src/rules/types.js';

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
    
    expect(result.metadata.totalMatched).toBe(result.instructions.length);
  });
});
