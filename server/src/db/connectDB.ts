import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const configuredPoolSize = Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10);
const poolSize = Number.isInteger(configuredPoolSize) && configuredPoolSize > 0 ? configuredPoolSize : 10;

const pool = new Pool({
    connectionString: process.env.PG_URI,
    max: poolSize,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

const connectDB = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        console.log('Connected to pool');
        client.release();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('Unable to connect to pool ' + message);
    }
};

export { pool, connectDB };
