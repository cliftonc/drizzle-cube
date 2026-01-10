/**
 * AI Prompt Templates for Drizzle Cube Query Generation
 *
 * This module provides the system prompts used for AI-assisted query building.
 * The prompts power a multi-stage generation flow:
 *
 * 0. **Step 0 - Validation**: Validate input for security and relevance
 *    - Uses STEP0_VALIDATION_PROMPT (fast/cheap model recommended)
 *
 * 1. **Single-Step Flow**: Used when no dimension values need to be fetched
 *    - Uses SYSTEM_PROMPT_TEMPLATE directly
 *
 * 2. **Multi-Stage Flow**: Used when dimension values are needed for filters
 *    - Step 1: Analyze query shape (STEP1_SYSTEM_PROMPT)
 *    - Step 2: Fetch dimension values from database (with security context)
 *    - Step 3: Generate final query (STEP2_SYSTEM_PROMPT)
 *
 * @see https://github.com/cliftonc/drizzle-cube/tree/main/src/server/prompts
 * @module
 */

// Types
export type { PromptContext, DimensionValues, Step1Result } from './types.js'
export type { Step0Result } from './step0-validation-prompt.js'

// Step 0: Input validation (use fast/cheap model)
export { STEP0_VALIDATION_PROMPT, buildStep0Prompt } from './step0-validation-prompt.js'

// Single-step generation (used when no dimension values needed)
export { SYSTEM_PROMPT_TEMPLATE, buildSystemPrompt } from './single-step-prompt.js'

// Multi-stage generation
export { STEP1_SYSTEM_PROMPT, buildStep1Prompt } from './step1-shape-prompt.js'
export { STEP2_SYSTEM_PROMPT, buildStep2Prompt } from './step2-complete-prompt.js'
