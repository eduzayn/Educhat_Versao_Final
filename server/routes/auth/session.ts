import { Express } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "../../core/db";
import { getOptimalAuthConfig } from "./config";

export function setupSession(app: Express) {
  const PgSession = ConnectPgSimple(session);
  const config = getOptimalAuthConfig();
  
  // Configurar trust proxy ANTES das sessões
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }
  
  console.log("🔒 Configuração de autenticação otimizada:", {
    environment: process.env.NODE_ENV,
    platform: config.platform,
    cookieSecure: config.cookieSecure,
    sameSite: config.sameSite,
    trustProxy: config.trustProxy,
    maxAgeDays: config.maxAge / (1000 * 60 * 60 * 24)
  });
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "user_sessions",
      }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      name: 'educhat-session',
      cookie: {
        secure: config.cookieSecure,
        httpOnly: true,
        maxAge: config.maxAge,
        sameSite: config.sameSite,
        domain: undefined,
        path: "/",
      },
    }),
  );

  // Middleware de debugging para sessões (apenas quando necessário)
  app.use((req, res, next) => {
    // Debug apenas em casos de falha de autenticação ou para endpoints administrativos específicos
    if (req.path.includes('/api/admin/role-permissions') && process.env.NODE_ENV === 'development') {
      console.log("🔍 Debug de sessão:", {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        cookies: !!req.headers.cookie
      });
    }
    next();
  });
} 