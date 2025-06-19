import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from './config/env';

neonConfig.webSocketConstructor = ws;

// Configurações otimizadas para Render
if (config.isProduction) {
  neonConfig.poolQueryViaFetch = true;
  neonConfig.fetchConnectionCache = true;
}

if (!config.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Pool otimizado para produção
const poolConfig = {
  connectionString: config.DATABASE_URL,
  ...(config.isProduction && {
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
    min: 2,
    allowExitOnIdle: true
  })
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });
