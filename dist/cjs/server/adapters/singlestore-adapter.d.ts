import { MySQLAdapter } from './mysql-adapter.js';
export declare class SingleStoreAdapter extends MySQLAdapter {
    getEngineType(): 'singlestore';
}
