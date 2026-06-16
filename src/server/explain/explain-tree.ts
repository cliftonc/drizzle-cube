/**
 * Shared helpers for EXPLAIN parsers.
 *
 * All engine parsers build a hierarchical operation tree from indentation
 * by maintaining a stack of (indent, operation) entries. This module
 * centralises that stack management so individual parsers stay simple.
 */

import type { ExplainOperation } from '../types/executor.js'

/** Stack entry tracking an operation and its indentation depth. */
export interface ExplainStackEntry {
  indent: number
  op: ExplainOperation
}

/**
 * Insert an operation into the hierarchical tree using the indentation stack.
 *
 * Pops the stack until the top entry has strictly less indentation than the
 * incoming operation, then attaches the operation either as a root (pushed to
 * `operations`) or as a child of the current stack top. Finally pushes the
 * operation onto the stack so subsequent deeper lines can nest under it.
 */
export function pushOperationToTree(
  stack: ExplainStackEntry[],
  operations: ExplainOperation[],
  operation: ExplainOperation,
  indent: number
): void {
  while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
    stack.pop()
  }

  if (stack.length === 0) {
    operations.push(operation)
  } else {
    const parent = stack[stack.length - 1].op
    if (!parent.children) {
      parent.children = []
    }
    parent.children.push(operation)
  }

  stack.push({ indent, op: operation })
}

/**
 * Count indentation level based on tree drawing characters and spaces.
 * Used by DuckDB and Databend parsers.
 */
export function countTreeIndent(line: string): number {
  let indent = 0
  for (const char of line) {
    if (char === ' ' || char === '│' || char === '├' || char === '└' || char === '─') {
      indent++
    } else {
      break
    }
  }
  return indent
}
