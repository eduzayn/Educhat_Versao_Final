import 'dotenv/config';

// Configuração de ambiente que prioriza variáveis do Replit
export const config = {
  // Banco de dados - prioriza Replit, depois .env, depois padrão
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  
  // Ambiente
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Porta - Replit define automaticamente
  PORT: process.env.PORT || "5000",
  
  // Replit específico
  REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
  REPLIT_URL: process.env.REPLIT_URL,
  
  // Outras variáveis
  SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret-key",
  ZAPI_TOKEN: process.env.ZAPI_TOKEN,
  ZAPI_INSTANCE_ID: process.env.ZAPI_INSTANCE_ID,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // Detecção de plataforma
  isReplit: !!process.env.REPLIT_DOMAINS,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development'
};

console.log("🔧 Configuração de ambiente:", {
  platform: config.isReplit ? 'Replit' : 'Local',
  environment: config.NODE_ENV,
  port: config.PORT,
  database: config.DATABASE_URL.includes('file:') ? 'SQLite (Local)' : 'PostgreSQL'
}); 