/**
 * Pattern matcher - matches files and contexts to instruction rules
 */

import micromatch from 'micromatch';
import type { Instruction, MatchContext, MatchResult } from './types.js';

/**
 * Language to file extension mapping
 */
const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  javascript: ['.js', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  python: ['.py', '.pyi', '.pyx'],
  java: ['.java'],
  c: ['.c', '.h'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh'],
  csharp: ['.cs'],
  go: ['.go'],
  rust: ['.rs'],
  ruby: ['.rb'],
  php: ['.php'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
  scala: ['.scala'],
  shell: ['.sh', '.bash'],
  powershell: ['.ps1'],
  yaml: ['.yml', '.yaml'],
  json: ['.json'],
  xml: ['.xml', '.xsd', '.xslt', '.wsdl'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.sass', '.less'],
  sql: ['.sql', '.ddl', '.dml'],
  dockerfile: ['Dockerfile', '.dockerfile'],
};

/**
 * Critical rules that should always be included
 */
const CRITICAL_RULE_IDS = [
  'codeguard-1-hardcoded-credentials',
  'codeguard-1-crypto-algorithms',
  'codeguard-1-digital-certificates',
];

/**
 * Context keyword to rule mapping
 */
const CONTEXT_KEYWORDS: Record<string, string[]> = {
  auth: ['codeguard-0-authentication-mfa', 'codeguard-0-authorization-access-control'],
  authentication: ['codeguard-0-authentication-mfa', 'codeguard-0-session-management-and-cookies'],
  authorization: ['codeguard-0-authorization-access-control'],
  login: ['codeguard-0-authentication-mfa', 'codeguard-0-session-management-and-cookies'],
  password: ['codeguard-0-authentication-mfa', 'codeguard-1-crypto-algorithms'],
  crypto: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  hash: ['codeguard-1-crypto-algorithms'],
  encrypt: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  certificate: ['codeguard-1-digital-certificates'],
  ssl: ['codeguard-1-digital-certificates'],
  tls: ['codeguard-1-digital-certificates'],
  database: ['codeguard-0-data-storage', 'codeguard-0-input-validation-injection'],
  sql: ['codeguard-0-input-validation-injection', 'codeguard-0-data-storage'],
  query: ['codeguard-0-input-validation-injection'],
  api: ['codeguard-0-api-web-services'],
  rest: ['codeguard-0-api-web-services'],
  graphql: ['codeguard-0-api-web-services'],
  session: ['codeguard-0-session-management-and-cookies'],
  cookie: ['codeguard-0-session-management-and-cookies'],
  upload: ['codeguard-0-file-handling-and-uploads'],
  file: ['codeguard-0-file-handling-and-uploads'],
  xss: ['codeguard-0-client-side-web-security'],
  csrf: ['codeguard-0-client-side-web-security'],
  injection: ['codeguard-0-input-validation-injection'],
  docker: ['codeguard-0-devops-ci-cd-containers'],
  kubernetes: ['codeguard-0-cloud-orchestration-kubernetes'],
  k8s: ['codeguard-0-cloud-orchestration-kubernetes'],
  logging: ['codeguard-0-logging'],
  mobile: ['codeguard-0-mobile-apps'],
};

/**
 * Match instructions based on context
 */
export function matchInstructions(
  context: MatchContext,
  allInstructions: Instruction[]
): MatchResult {
  const matches = new Set<Instruction>();
  const matchedBy: MatchResult['metadata']['matchedBy'] = {};
  
  // 1. Match by file path
  if (context.filepath) {
    const fileMatches = matchByFilePath(context.filepath, allInstructions);
    fileMatches.forEach(i => matches.add(i));
    matchedBy.filepath = fileMatches.length;
  }
  
  // 2. Match by language
  if (context.language) {
    const langMatches = matchByLanguage(context.language, allInstructions);
    langMatches.forEach(i => matches.add(i));
    matchedBy.language = langMatches.length;
  }
  
  // 3. Match by context keywords
  if (context.context) {
    const contextMatches = matchByContext(context.context, allInstructions);
    contextMatches.forEach(i => matches.add(i));
    matchedBy.context = contextMatches.length;
  }
  
  // 4. Always include critical rules
  const criticalMatches = allInstructions.filter(i => 
    CRITICAL_RULE_IDS.includes(i.id)
  );
  criticalMatches.forEach(i => matches.add(i));
  matchedBy.critical = criticalMatches.length;
  
  const instructions = Array.from(matches);
  
  return {
    instructions,
    metadata: {
      totalMatched: instructions.length,
      matchedBy,
    },
  };
}

/**
 * Match instructions by file path using glob patterns
 */
function matchByFilePath(filepath: string, instructions: Instruction[]): Instruction[] {
  const matched: Instruction[] = [];
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  for (const instruction of instructions) {
    for (const pattern of instruction.patterns) {
      if (micromatch.isMatch(normalizedPath, pattern)) {
        matched.push(instruction);
        break;
      }
    }
  }
  
  return matched;
}

/**
 * Match instructions by programming language
 */
function matchByLanguage(language: string, instructions: Instruction[]): Instruction[] {
  const normalizedLang = language.toLowerCase();
  const extensions = LANGUAGE_EXTENSIONS[normalizedLang] || [];
  
  if (extensions.length === 0) {
    return [];
  }
  
  const matched: Instruction[] = [];
  
  for (const instruction of instructions) {
    for (const pattern of instruction.patterns) {
      if (patternMatchesExtensions(pattern, extensions)) {
        matched.push(instruction);
        break;
      }
    }
  }
  
  return matched;
}

/**
 * Check if a glob pattern matches any of the given extensions
 */
function patternMatchesExtensions(pattern: string, extensions: string[]): boolean {
  return extensions.some(ext => pattern.includes(ext));
}

/**
 * Match instructions by context keywords
 */
function matchByContext(context: string, instructions: Instruction[]): Instruction[] {
  const matched = new Set<Instruction>();
  const normalizedContext = context.toLowerCase();
  const words = normalizedContext.split(/\s+/);
  const matchedRuleIds = new Set<string>();
  
  for (const word of words) {
    for (const [keyword, ruleIds] of Object.entries(CONTEXT_KEYWORDS)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        ruleIds.forEach(id => matchedRuleIds.add(id));
      }
    }
  }
  
  for (const instruction of instructions) {
    if (matchedRuleIds.has(instruction.id)) {
      matched.add(instruction);
    }
  }
  
  return Array.from(matched);
}
