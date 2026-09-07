import { SQL, AnyColumn } from 'drizzle-orm';
import { WindowFunctionType, WindowFunctionConfig } from './base-adapter.js';
type FieldExpr = AnyColumn | SQL | null;
/** Build the full `OVER (...)` clause from partition/order/frame components. */
export declare function buildWindowOverClause(partitionBy?: (AnyColumn | SQL)[], orderBy?: Array<{
    field: AnyColumn | SQL;
    direction: 'asc' | 'desc';
}>, config?: WindowFunctionConfig): SQL;
/** Build the window function expression for a given type and pre-built OVER clause. */
export declare function buildWindowExpression(type: WindowFunctionType, fieldExpr: FieldExpr, over: SQL, config?: WindowFunctionConfig): SQL;
export {};
