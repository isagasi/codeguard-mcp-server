/**
 * Types for instruction rules and matching
 */

export interface InstructionFrontmatter {
  applyTo: string;
  description: string;
  version: string;
  [key: string]: any;
}

export interface Instruction {
  /** Rule ID (filename without extension) */
  id: string;
  
  /** Full path to the instruction file */
  filepath: string;
  
  /** Parsed frontmatter metadata */
  frontmatter: InstructionFrontmatter;
  
  /** Full markdown content */
  content: string;
  
  /** Parsed glob patterns from applyTo */
  patterns: string[];
  
  /** Whether this is a custom rule (vs default) */
  isCustom?: boolean;
  
  /** If this rule overrides a default rule */
  overrides?: string;
}

export interface MatchContext {
  /** File path to match against */
  filepath?: string;
  
  /** Programming language */
  language?: string;
  
  /** Context keywords from prompt */
  context?: string;
}

export interface MatchResult {
  /** Matched instructions */
  instructions: Instruction[];
  
  /** Match metadata */
  metadata: {
    totalMatched: number;
    matchedBy: {
      filepath?: number;
      language?: number;
      context?: number;
      critical?: number;
    };
    priorityBreakdown?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

export enum RulePriority {
  CRITICAL = 100,  // Always include (credentials, crypto)
  HIGH = 75,       // Context + language matched
  MEDIUM = 50,     // Language matched
  LOW = 25,        // General/framework-specific
}

export interface ScoredInstruction {
  instruction: Instruction;
  priority: RulePriority;
  score: number;
  matchReasons: string[];
}
