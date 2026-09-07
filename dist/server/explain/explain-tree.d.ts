import { ExplainOperation } from '../types/executor.js';
/** Stack entry tracking an operation and its indentation depth. */
export interface ExplainStackEntry {
    indent: number;
    op: ExplainOperation;
}
/**
 * Insert an operation into the hierarchical tree using the indentation stack.
 *
 * Pops the stack until the top entry has strictly less indentation than the
 * incoming operation, then attaches the operation either as a root (pushed to
 * `operations`) or as a child of the current stack top. Finally pushes the
 * operation onto the stack so subsequent deeper lines can nest under it.
 */
export declare function pushOperationToTree(stack: ExplainStackEntry[], operations: ExplainOperation[], operation: ExplainOperation, indent: number): void;
/**
 * Count indentation level based on tree drawing characters and spaces.
 * Used by DuckDB and Databend parsers.
 */
export declare function countTreeIndent(line: string): number;
