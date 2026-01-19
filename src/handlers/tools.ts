/**
 * MCP Tool Handlers - Expose instructions as executable tools for GitHub Copilot
 */

import type { Instruction } from '../rules/types.js';
import { matchInstructions } from '../rules/matcher.js';

/**
 * List all available tools
 */
export function listTools() {
  return {
    tools: [
      {
        name: 'get_security_instructions',
        description: 'Get security instructions for code generation. Returns applicable security rules based on language, context, or file path.',
        inputSchema: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              description: 'Programming language (python, javascript, typescript, java, c, etc.)',
            },
            context: {
              type: 'string',
              description: 'Context keywords (auth, crypto, database, api, password, hash, etc.)',
            },
            filepath: {
              type: 'string',
              description: 'File path for pattern matching (e.g., src/auth/login.ts)',
            },
          },
        },
      },
      {
        name: 'validate_code_security',
        description: 'Validate code snippet against security rules and return applicable instructions',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code snippet to validate',
            },
            language: {
              type: 'string',
              description: 'Programming language of the code',
            },
          },
          required: ['code', 'language'],
        },
      },
    ],
  };
}

/**
 * Execute a tool call
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  instructions: Instruction[]
) {
  if (name === 'get_security_instructions') {
    return getSecurityInstructions(args, instructions);
  }
  
  if (name === 'validate_code_security') {
    return validateCodeSecurity(args, instructions);
  }
  
  throw new Error(`Unknown tool: ${name}`);
}

/**
 * Get security instructions tool
 */
function getSecurityInstructions(
  args: Record<string, unknown>,
  instructions: Instruction[]
) {
  const language = args.language as string | undefined;
  const context = args.context as string | undefined;
  const filepath = args.filepath as string | undefined;
  
  // Match instructions
  const result = matchInstructions(
    { language, context, filepath },
    instructions
  );
  
  // Format as markdown
  const content = result.instructions
    .map(i => {
      return `## ${i.frontmatter.description}\n\n${i.content}`;
    })
    .join('\n\n---\n\n');
  
  return {
    content: [
      {
        type: 'text',
        text: content || 'No specific security instructions matched. Follow general security best practices.',
      },
    ],
    isError: false,
  };
}

/**
 * Validate code security tool
 */
function validateCodeSecurity(
  args: Record<string, unknown>,
  instructions: Instruction[]
) {
  const code = args.code as string;
  const language = args.language as string;
  
  if (!code || !language) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Both code and language are required',
        },
      ],
      isError: true,
    };
  }
  
  // Get applicable instructions
  const result = matchInstructions({ language }, instructions);
  
  // Build response with instructions and validation context
  const response = [
    `# Security Validation for ${language.toUpperCase()} Code`,
    '',
    `Analyzing the provided code against ${result.instructions.length} security rules...`,
    '',
    '## Applicable Security Rules:',
    '',
  ];
  
  result.instructions.forEach(i => {
    response.push(`### ${i.frontmatter.description}`);
    response.push('');
    response.push(i.content);
    response.push('');
    response.push('---');
    response.push('');
  });
  
  response.push('## Recommendation:');
  response.push('Review your code against the above security rules and ensure compliance.');
  
  return {
    content: [
      {
        type: 'text',
        text: response.join('\n'),
      },
    ],
    isError: false,
  };
}
