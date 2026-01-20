/**
 * Pattern matcher - matches files and contexts to instruction rules
 */

import micromatch from 'micromatch';
import type { Instruction, MatchContext, MatchResult, RulePriority, ScoredInstruction } from './types.js';
import { RulePriority as Priority } from './types.js';

/**
 * Language to file extension mapping (comprehensive)
 */
const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  // Web languages
  javascript: ['.js', '.mjs', '.cjs', '.jsx'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.sass', '.less'],
  
  // Backend languages
  python: ['.py', '.pyi', '.pyx'],
  java: ['.java'],
  c: ['.c', '.h'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.c++'],
  csharp: ['.cs'],
  go: ['.go'],
  rust: ['.rs'],
  ruby: ['.rb'],
  php: ['.php'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
  scala: ['.scala'],
  perl: ['.pl', '.pm'],
  
  // Mobile languages
  objectivec: ['.m', '.mm'],
  dart: ['.dart'],
  
  // Scripting
  shell: ['.sh', '.bash'],
  powershell: ['.ps1'],
  
  // Data formats
  yaml: ['.yml', '.yaml'],
  json: ['.json'],
  xml: ['.xml', '.xsd', '.xslt', '.wsdl'],
  
  // Database
  sql: ['.sql', '.ddl', '.dml'],
  
  // Infrastructure
  dockerfile: ['Dockerfile', '.dockerfile'],
  terraform: ['.tf', '.tfvars'],
  
  // Other
  markdown: ['.md', '.markdown'],
};

/**
 * Reverse map: extension to language
 */
const EXTENSION_TO_LANGUAGE = new Map<string, string>();
for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
  for (const ext of exts) {
    EXTENSION_TO_LANGUAGE.set(ext.toLowerCase(), lang);
  }
}

/**
 * Critical rules that should always be included
 */
const CRITICAL_RULE_IDS = [
  'codeguard-1-hardcoded-credentials',
  'codeguard-1-crypto-algorithms',
  'codeguard-1-digital-certificates',
];

/**
 * Context keyword to rule mapping (enhanced)
 */
const CONTEXT_KEYWORDS: Record<string, string[]> = {
  // Authentication & Authorization
  auth: ['codeguard-0-authentication-mfa', 'codeguard-0-authorization-access-control'],
  authentication: ['codeguard-0-authentication-mfa', 'codeguard-0-session-management-and-cookies'],
  authorization: ['codeguard-0-authorization-access-control'],
  login: ['codeguard-0-authentication-mfa', 'codeguard-0-session-management-and-cookies'],
  password: ['codeguard-0-authentication-mfa', 'codeguard-1-crypto-algorithms'],
  mfa: ['codeguard-0-authentication-mfa'],
  oauth: ['codeguard-0-authentication-mfa'],
  saml: ['codeguard-0-authentication-mfa'],
  jwt: ['codeguard-0-authentication-mfa', 'codeguard-0-session-management-and-cookies'],
  
  // Cryptography
  crypto: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  cryptography: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  hash: ['codeguard-1-crypto-algorithms'],
  encrypt: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  decrypt: ['codeguard-1-crypto-algorithms', 'codeguard-0-additional-cryptography'],
  cipher: ['codeguard-1-crypto-algorithms'],
  certificate: ['codeguard-1-digital-certificates'],
  ssl: ['codeguard-1-digital-certificates'],
  tls: ['codeguard-1-digital-certificates'],
  pki: ['codeguard-1-digital-certificates'],
  
  // Database & Storage
  database: ['codeguard-0-data-storage', 'codeguard-0-input-validation-injection'],
  sql: ['codeguard-0-input-validation-injection', 'codeguard-0-data-storage'],
  query: ['codeguard-0-input-validation-injection'],
  orm: ['codeguard-0-data-storage'],
  postgres: ['codeguard-0-data-storage'],
  mysql: ['codeguard-0-data-storage'],
  mongodb: ['codeguard-0-data-storage'],
  
  // API & Web Services
  api: ['codeguard-0-api-web-services'],
  rest: ['codeguard-0-api-web-services'],
  graphql: ['codeguard-0-api-web-services'],
  soap: ['codeguard-0-api-web-services'],
  endpoint: ['codeguard-0-api-web-services'],
  
  // Session Management
  session: ['codeguard-0-session-management-and-cookies'],
  cookie: ['codeguard-0-session-management-and-cookies'],
  
  // File Handling
  upload: ['codeguard-0-file-handling-and-uploads'],
  file: ['codeguard-0-file-handling-and-uploads'],
  download: ['codeguard-0-file-handling-and-uploads'],
  
  // Client-side Security
  xss: ['codeguard-0-client-side-web-security'],
  csrf: ['codeguard-0-client-side-web-security'],
  clickjacking: ['codeguard-0-client-side-web-security'],
  csp: ['codeguard-0-client-side-web-security'],
  
  // Input Validation
  injection: ['codeguard-0-input-validation-injection'],
  validate: ['codeguard-0-input-validation-injection'],
  sanitize: ['codeguard-0-input-validation-injection'],
  
  // Infrastructure
  docker: ['codeguard-0-devops-ci-cd-containers', 'codeguard-0-supply-chain-security'],
  kubernetes: ['codeguard-0-cloud-orchestration-kubernetes'],
  k8s: ['codeguard-0-cloud-orchestration-kubernetes'],
  container: ['codeguard-0-devops-ci-cd-containers'],
  cicd: ['codeguard-0-devops-ci-cd-containers'],
  
  // Logging & Monitoring
  logging: ['codeguard-0-logging'],
  log: ['codeguard-0-logging'],
  
  // Mobile
  mobile: ['codeguard-0-mobile-apps'],
  android: ['codeguard-0-mobile-apps'],
  ios: ['codeguard-0-mobile-apps'],
  
  // Privacy
  gdpr: ['codeguard-0-privacy-data-protection'],
  privacy: ['codeguard-0-privacy-data-protection'],
  pii: ['codeguard-0-privacy-data-protection'],
  
  // Serialization
  xml: ['codeguard-0-xml-and-serialization'],
  deserialize: ['codeguard-0-xml-and-serialization'],
  serialize: ['codeguard-0-xml-and-serialization'],
};

/**
 * Match instructions based on context with priority scoring
 */
export function matchInstructions(
  context: MatchContext,
  allInstructions: Instruction[]
): MatchResult {
  const scoredInstructions: ScoredInstruction[] = [];
  const matchedBy: MatchResult['metadata']['matchedBy'] = {};
  
  // Score all instructions
  for (const instruction of allInstructions) {
    const scored = scoreInstruction(instruction, context);
    if (scored.score > 0) {
      scoredInstructions.push(scored);
    }
  }
  
  // Sort by priority (high to low), then by score
  scoredInstructions.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return b.score - a.score;
  });
  
  // Count matches by type
  matchedBy.critical = scoredInstructions.filter(s => s.priority === Priority.CRITICAL).length;
  matchedBy.language = scoredInstructions.filter(s => s.matchReasons.includes('language')).length;
  matchedBy.filepath = scoredInstructions.filter(s => s.matchReasons.includes('filepath')).length;
  matchedBy.context = scoredInstructions.filter(s => s.matchReasons.includes('context')).length;
  
  // Priority breakdown
  const priorityBreakdown = {
    critical: scoredInstructions.filter(s => s.priority === Priority.CRITICAL).length,
    high: scoredInstructions.filter(s => s.priority === Priority.HIGH).length,
    medium: scoredInstructions.filter(s => s.priority === Priority.MEDIUM).length,
    low: scoredInstructions.filter(s => s.priority === Priority.LOW).length,
  };
  
  // Limit to top 15 rules to keep response size manageable
  const topInstructions = scoredInstructions.slice(0, 15);
  
  return {
    instructions: topInstructions.map(s => s.instruction),
    metadata: {
      totalMatched: scoredInstructions.length,
      matchedBy,
      priorityBreakdown,
    },
  };
}

/**
 * Score an instruction based on match context
 */
function scoreInstruction(
  instruction: Instruction,
  context: MatchContext
): ScoredInstruction {
  let score = 0;
  let priority: RulePriority = Priority.LOW;
  const matchReasons: string[] = [];
  
  // Critical rules always included with highest priority
  if (CRITICAL_RULE_IDS.includes(instruction.id)) {
    priority = Priority.CRITICAL;
    score = 1000;
    matchReasons.push('critical');
    return { instruction, priority, score, matchReasons };
  }
  
  // Match by file path
  if (context.filepath) {
    const normalizedPath = context.filepath.replace(/\\/g, '/');
    for (const pattern of instruction.patterns) {
      // Check for negative patterns
      if (pattern.startsWith('!')) {
        const negativePattern = pattern.substring(1);
        if (micromatch.isMatch(normalizedPath, negativePattern)) {
          // Negative match - exclude this rule
          return { instruction, priority: Priority.LOW, score: 0, matchReasons: [] };
        }
      } else if (micromatch.isMatch(normalizedPath, pattern)) {
        score += 50;
        matchReasons.push('filepath');
        break;
      }
    }
  }
  
  // Match by language (with auto-detection from filepath)
  let detectedLanguage = context.language?.toLowerCase();
  if (!detectedLanguage && context.filepath) {
    detectedLanguage = detectLanguageFromPath(context.filepath);
  }
  
  if (detectedLanguage) {
    const extensions = LANGUAGE_EXTENSIONS[detectedLanguage] || [];
    if (extensions.length > 0) {
      for (const pattern of instruction.patterns) {
        if (patternMatchesExtensions(pattern, extensions)) {
          score += 30;
          matchReasons.push('language');
          break;
        }
      }
    }
  }
  
  // Match by context keywords
  if (context.context) {
    const contextScore = scoreByContext(context.context, instruction.id);
    if (contextScore > 0) {
      score += contextScore;
      matchReasons.push('context');
    }
  }
  
  // Determine priority based on match combination
  if (matchReasons.length >= 2) {
    // Multiple match types = HIGH priority
    priority = Priority.HIGH;
  } else if (matchReasons.length === 1) {
    // Single match type = MEDIUM priority
    priority = Priority.MEDIUM;
  }
  
  return { instruction, priority, score, matchReasons };
}

/**
 * Detect language from file path extension
 */
export function detectLanguageFromPath(filepath: string): string | undefined {
  const normalizedPath = filepath.toLowerCase();
  
  // Check for special files first (Dockerfile, etc.)
  const basename = filepath.split(/[/\\]/).pop() || '';
  if (basename.toLowerCase().startsWith('dockerfile')) {
    return 'dockerfile';
  }
  
  // Extract extension
  const match = normalizedPath.match(/(\.[^.]+)$/);
  if (!match) {
    return undefined;
  }
  
  return EXTENSION_TO_LANGUAGE.get(match[1]);
}

/**
 * Get language extensions for a given language
 */
export function getLanguageExtensions(language: string): string[] {
  return LANGUAGE_EXTENSIONS[language.toLowerCase()] || [];
}

/**
 * Check if a glob pattern matches any of the given extensions
 */
function patternMatchesExtensions(pattern: string, extensions: string[]): boolean {
  // Skip negative patterns
  if (pattern.startsWith('!')) {
    return false;
  }
  return extensions.some(ext => pattern.includes(ext));
}

/**
 * Score instruction by context keywords with weighted matching
 */
function scoreByContext(context: string, instructionId: string): number {
  const normalizedContext = context.toLowerCase();
  const words = normalizedContext.split(/\s+/);
  let score = 0;
  
  for (const word of words) {
    for (const [keyword, ruleIds] of Object.entries(CONTEXT_KEYWORDS)) {
      if (ruleIds.includes(instructionId)) {
        // Exact match = higher score
        if (word === keyword) {
          score += 20;
        }
        // Partial match = lower score
        else if (word.includes(keyword) || keyword.includes(word)) {
          score += 10;
        }
      }
    }
  }
  
  return score;
}

// Export helper functions for testing and backward compatibility
export { matchByFilePath, matchByLanguage, matchByContext };

// Helper functions

/**
 * Match instructions by file path using glob patterns
 */
function matchByFilePath(filepath: string, instructions: Instruction[]): Instruction[] {
  const matched: Instruction[] = [];
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  for (const instruction of instructions) {
    for (const pattern of instruction.patterns) {
      // Skip negative patterns in legacy function
      if (pattern.startsWith('!')) {
        continue;
      }
      
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
