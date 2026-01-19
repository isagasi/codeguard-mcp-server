/**
 * MCP Resource Handlers - Serve instructions as MCP resources
 */

import type { Instruction } from '../rules/types.js';
import { matchInstructions } from '../rules/matcher.js';

/**
 * List all available resources
 */
export function listResources() {
  return {
    resources: [
      {
        uri: 'codeguard://instructions/all',
        name: 'All CodeGuard Security Instructions',
        description: 'Complete set of all security instructions',
        mimeType: 'text/markdown',
      },
      {
        uri: 'codeguard://instructions/python',
        name: 'Python Security Instructions',
        description: 'Security instructions for Python development',
        mimeType: 'text/markdown',
      },
      {
        uri: 'codeguard://instructions/javascript',
        name: 'JavaScript Security Instructions',
        description: 'Security instructions for JavaScript development',
        mimeType: 'text/markdown',
      },
      {
        uri: 'codeguard://instructions/typescript',
        name: 'TypeScript Security Instructions',
        description: 'Security instructions for TypeScript development',
        mimeType: 'text/markdown',
      },
      {
        uri: 'codeguard://instructions/file',
        name: 'Instructions by File Path',
        description: 'Get instructions matching a specific file pattern (use ?path= query param)',
        mimeType: 'text/markdown',
      },
    ],
  };
}

/**
 * Read a specific resource by URI
 */
export function readResource(uri: string, instructions: Instruction[]) {
  // Parse URI
  const url = new URL(uri);
  const path = url.pathname;
  
  // Handle different resource types
  if (path === '/instructions/all') {
    return getAllInstructions(instructions);
  }
  
  if (path === '/instructions/file') {
    const filepath = url.searchParams.get('path');
    if (filepath) {
      return getInstructionsByFilePath(filepath, instructions);
    }
    return { error: 'Missing path parameter' };
  }
  
  // Handle language-specific resources
  const languageMatch = path.match(/^\/instructions\/([a-z]+)$/);
  if (languageMatch) {
    const language = languageMatch[1];
    return getInstructionsByLanguage(language, instructions);
  }
  
  return { error: `Unknown resource: ${uri}` };
}

/**
 * Get all instructions concatenated
 */
function getAllInstructions(instructions: Instruction[]) {
  const content = instructions
    .map(i => `# ${i.frontmatter.description}\n\n${i.content}`)
    .join('\n\n---\n\n');
  
  return {
    contents: [
      {
        uri: 'codeguard://instructions/all',
        mimeType: 'text/markdown',
        text: content,
      },
    ],
  };
}

/**
 * Get instructions for a specific language
 */
function getInstructionsByLanguage(language: string, instructions: Instruction[]) {
  const result = matchInstructions({ language }, instructions);
  
  const content = result.instructions
    .map(i => `# ${i.frontmatter.description}\n\n${i.content}`)
    .join('\n\n---\n\n');
  
  return {
    contents: [
      {
        uri: `codeguard://instructions/${language}`,
        mimeType: 'text/markdown',
        text: content || `No instructions found for language: ${language}`,
      },
    ],
  };
}

/**
 * Get instructions for a specific file path
 */
function getInstructionsByFilePath(filepath: string, instructions: Instruction[]) {
  const result = matchInstructions({ filepath }, instructions);
  
  const content = result.instructions
    .map(i => `# ${i.frontmatter.description}\n\n${i.content}`)
    .join('\n\n---\n\n');
  
  return {
    contents: [
      {
        uri: `codeguard://instructions/file?path=${filepath}`,
        mimeType: 'text/markdown',
        text: content || `No instructions found for file: ${filepath}`,
      },
    ],
  };
}
