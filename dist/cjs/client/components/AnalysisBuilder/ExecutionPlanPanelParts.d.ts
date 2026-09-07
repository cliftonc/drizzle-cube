import { ReactNode } from 'react';
import { ExplainResult } from '../../types.js';
export declare function SqlBlock({ sql, sqlLoading, sqlError, sqlPlaceholder, formattedSql, title, height, headerRight, }: {
    sql: {
        sql: string;
        params?: unknown[];
    } | null | undefined;
    sqlLoading: boolean;
    sqlError?: Error | null;
    sqlPlaceholder: string;
    formattedSql: string;
    title: string;
    height: string;
    headerRight: ReactNode;
}): import("react").JSX.Element;
export declare function ExplainResults({ explainLoading, explainError, explainResult, useAnalyze, aiButton, }: {
    explainLoading: boolean;
    explainError?: Error | null;
    explainResult: ExplainResult | null;
    useAnalyze: boolean;
    aiButton: ReactNode;
}): import("react").JSX.Element | null;
