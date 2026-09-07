import { SQL } from 'drizzle-orm';
import { DatabaseAdapter } from '../../adapters/base-adapter.js';
import { DrizzleSqlBuilder } from '../drizzle-sql-builder.js';
import { CTEBuilder } from '../../builders/cte-builder.js';
import { Cube, PhysicalQueryPlan } from '../../types/index.js';
export interface PhysicalBuildDependencies {
    queryBuilder: DrizzleSqlBuilder;
    cteBuilder: CTEBuilder;
    databaseAdapter: DatabaseAdapter;
}
export interface DownstreamJoinState {
    cteAlias: string;
    joinKeys: Array<{
        sourceColumn: string;
        targetColumn: string;
        sourceColumnObj?: any;
        targetColumnObj?: any;
    }>;
}
export interface CTEBuildState {
    preBuiltFilterMap: Map<string, SQL[]>;
    ctes: any[];
    cteAliasMap: Map<string, string>;
    downstreamCubeMap: Map<string, DownstreamJoinState>;
}
export interface JoinBuildState {
    drizzleQuery: any;
    allWhereConditions: SQL[];
    cubesWithSecurityInJoin: Set<string>;
    absorbedIntermediateCubes: Set<string>;
}
export type SelectionMap = Record<string, any>;
/**
 * Apply a join of the given type to a Drizzle query builder.
 * Shared by the physical-plan builders that assemble CTE/merge queries.
 */
export declare function applyJoinByType(drizzleQuery: any, joinType: 'inner' | 'left' | 'right' | 'full', joinTarget: any, joinCondition: SQL): any;
export declare function getCubesFromPlan(queryPlan: PhysicalQueryPlan): Map<string, Cube>;
