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
});
