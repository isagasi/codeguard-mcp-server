/**
 * Rule loader - loads and parses instruction files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import type { Instruction, InstructionFrontmatter } from './types.js';

/**
 * Load all instruction files from a directory, including custom rules
 */
export async function loadInstructions(rulesDir: string): Promise<Instruction[]> {
  const defaultInstructions = await loadInstructionsFromDir(rulesDir, false);
  
  // Try to load custom rules from custom/ subdirectory
  const customDir = path.join(rulesDir, 'custom');
  const customInstructions = await loadInstructionsFromDir(customDir, true);
  
  // Merge instructions with custom rules overriding defaults
  const mergedInstructions = mergeInstructions(defaultInstructions, customInstructions);
  
  console.log(`Loaded ${defaultInstructions.length} default + ${customInstructions.length} custom = ${mergedInstructions.length} total instruction files`);
  return mergedInstructions;
}

/**
 * Load instructions from a specific directory
 */
async function loadInstructionsFromDir(rulesDir: string, isCustom: boolean): Promise<Instruction[]> {
  const instructions: Instruction[] = [];
  
  try {
    const files = await findInstructionFiles(rulesDir);
    
    for (const file of files) {
      const filepath = path.join(rulesDir, file);
      
      try {
        const instruction = await loadInstruction(filepath, isCustom);
        instructions.push(instruction);
      } catch (error) {
        console.error(`Failed to load instruction file ${filepath}:`, error);
        // Continue loading other files
      }
    }
    
    return instructions;
  } catch (error) {
    // Directory might not exist (e.g., custom/ not created yet)
    if (isCustom) {
      return [];
    }
    console.error(`Failed to load instructions from ${rulesDir}:`, error);
    return [];
  }
}

/**
 * Merge default and custom instructions, with custom rules overriding defaults
 */
function mergeInstructions(
  defaultInstructions: Instruction[],
  customInstructions: Instruction[]
): Instruction[] {
  const merged = new Map<string, Instruction>();
  
  // Add all default instructions
  for (const instruction of defaultInstructions) {
    merged.set(instruction.id, instruction);
  }
  
  // Add/override with custom instructions
  for (const customInstruction of customInstructions) {
    const existingDefault = merged.get(customInstruction.id);
    
    if (existingDefault) {
      // Mark as override
      customInstruction.overrides = existingDefault.id;
      console.log(`Custom rule '${customInstruction.id}' overrides default rule`);
    }
    
    merged.set(customInstruction.id, customInstruction);
  }
  
  return Array.from(merged.values());
}

/**
 * Find all .instructions.md files recursively
 */
async function findInstructionFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findInstructionFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.instructions.md')) {
        // Get relative path from base directory
        const relativePath = path.relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Load and parse a single instruction file
 */
async function loadInstruction(filepath: string, isCustom: boolean = false): Promise<Instruction> {
  const fileContent = await fs.readFile(filepath, 'utf-8');
  
  // Parse frontmatter
  const { data } = matter(fileContent);
  
  // Validate required fields
  if (!data.applyTo) {
    throw new Error(`Missing 'applyTo' in frontmatter: ${filepath}`);
  }
  
  // Parse applyTo patterns
  const patterns = parseApplyToPatterns(data.applyTo);
  
  // Extract ID from filename
  const id = path.basename(filepath, '.instructions.md');
  
  return {
    id,
    filepath,
    frontmatter: data as InstructionFrontmatter,
    content: fileContent, // Keep full content including frontmatter
    patterns,
    isCustom,
  };
}

/**
 * Parse applyTo field into glob patterns
 */
function parseApplyToPatterns(applyTo: string): string[] {
  if (!applyTo || typeof applyTo !== 'string') {
    return [];
  }
  
  return applyTo
    .split(',')
    .map(pattern => pattern.trim())
    .filter(pattern => pattern.length > 0);
}
