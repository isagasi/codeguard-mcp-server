/**
 * MCP Prompt Handlers - Dynamic instruction injection
 */

import type { Instruction } from '../rules/types.js';
import { matchInstructions } from '../rules/matcher.js';

/**
 * List all available prompts
 */
export function listPrompts() {
  return {
    prompts: [
      {
        name: 'get_security_instructions',
        description: 'Get security instructions for code generation based on language and context',
        arguments: [
          {
            name: 'language',
            description: 'Programming language (python, javascript, typescript, etc.)',
            required: false,
          },
          {
            name: 'context',
            description: 'Context keywords (auth, crypto, database, api, etc.)',
            required: false,
          },
          {
            name: 'filepath',
            description: 'Target file path for pattern matching',
            required: false,
          },
        ],
      },
    ],
  };
}

/**
 * Get a specific prompt
 */
export function getPrompt(name: string, args: Record<string, string>, instructions: Instruction[]) {
  if (name === 'get_security_instructions') {
    return getSecurityInstructions(args, instructions);
  }
  
  return {
    description: `Unknown prompt: ${name}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Error: Prompt "${name}" not found`,
        },
      },
    ],
  };
}

/**
 * Get security instructions based on arguments
 */
function getSecurityInstructions(args: Record<string, string>, instructions: Instruction[]) {
  const { language, context, filepath } = args;
  
  // Match instructions
  const result = matchInstructions(
    { language, context, filepath },
    instructions
  );
  
  // Format matched instructions
  const content = result.instructions
    .map(i => `# ${i.frontmatter.description}\n\n${i.content}`)
    .join('\n\n---\n\n');
  
  // Build context description
  const parts = [];
  if (language) parts.push(`language: ${language}`);
  if (context) parts.push(`context: ${context}`);
  if (filepath) parts.push(`file: ${filepath}`);
  const contextDesc = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  
  return {
    description: `Security instructions for code generation${contextDesc}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content || 'No specific instructions matched. Follow general security best practices.',
        },
      },
    ],
  };
}
