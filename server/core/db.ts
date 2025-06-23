import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Configuração robusta de connection pool para produção
const isProduction = process.env.NODE_ENV === 'production';
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configurações para evitar timeouts em produção
  max: isProduction ? 20 : 10, // Máximo de conexões
  min: isProduction ? 5 : 2,   // Mínimo de conexões
  idleTimeoutMillis: 30000,    // 30s timeout para conexões ociosas
  connectionTimeoutMillis: 5000, // 5s timeout para estabelecer conexão
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Configurações específicas para Neon
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  statement_timeout: 15000,    // 15s timeout para queries
  query_timeout: 15000,
  // Retry automático
  application_name: 'educhat-production'
});

// Event listeners para monitorar conexões
pool.on('error', (err) => {
  console.error('❌ Pool de conexões - erro inesperado:', err);
});

pool.on('connect', () => {
  if (Math.random() < 0.1) { // Log apenas 10% das conexões
    console.log('🔌 Nova conexão estabelecida com o banco');
  }
});

export const db = drizzle(pool, { schema });