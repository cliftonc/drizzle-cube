import { SemanticLayerCompiler } from '../../server/compiler.js';
import { HttpPort } from './http-port.js';
import { BaseSecurityContextThunk } from './security-context.js';
/** REST handlers keyed by endpoint; each closes over the shared semantic layer. */
export interface RestHandlers {
    handleMetaGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleSqlGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleSqlPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleDryRunGet<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleDryRunPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleBatchPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
    handleExplainPost<TRes>(port: HttpPort<TRes>, getBaseSecurityContext: BaseSecurityContextThunk): Promise<TRes>;
}
export declare function createRestHandlers(semanticLayer: SemanticLayerCompiler): RestHandlers;
