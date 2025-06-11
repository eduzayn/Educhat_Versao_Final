import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "../../core/db";
import { storage } from "../../core/storage";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      displayName: string;
      role: string;
      roleId: number;
      dataKey?: string;
      channels: string[];
      macrosetores: string[];
      teamId?: number | null;
      team?: string | null;
    }
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

function getOptimalAuthConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  const railwayUrl = process.env.RAILWAY_STATIC_URL;
  const replitDomains = process.env.REPLIT_DOMAINS;
  
  // Detectar plataforma de hospedagem
  const isRender = !!renderUrl;
  const isRailway = !!railwayUrl;
  const isReplit = !!replitDomains;
  
  // Configurações otimizadas por plataforma
  let cookieSecure = false;
  let sameSite: 'strict' | 'lax' | 'none' = 'lax';
  
  if (isProduction) {
    if (isRender || isRailway) {
      cookieSecure = true;
      sameSite = 'lax';
    } else if (isReplit) {
      cookieSecure = false; // Replit tem problemas com cookies seguros
      sameSite = 'lax';
    }
  }
  
  return {
    isProduction,
    cookieSecure,
    sameSite,
    trustProxy: isProduction,
    sessionSecret: process.env.SESSION_SECRET || "educhat-fallback-secret-2024",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias para melhor estabilidade
    platform: isRender ? 'render' : isRailway ? 'railway' : isReplit ? 'replit' : 'unknown'
  };
}

export function setupAuth(app: Express) {
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

  // Middleware de debugging para sessões (apenas em produção)
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        console.log("🔍 Debug de sessão:", {
          path: req.path,
          method: req.method,
          sessionID: req.sessionID,
          hasSession: !!req.session,
          cookies: !!req.headers.cookie,
          userAgent: req.get('User-Agent')?.substring(0, 50) + "...",
          secure: req.secure,
          protocol: req.protocol
        });
      }
      next();
    });
  }

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const systemUser = await storage.getUserByEmail(email);
          if (!systemUser || !systemUser.password) {
            return done(null, false, { message: "Credenciais inválidas" });
          }

          // Check if password is hashed (starts with $2b$) or plain text
          let isMatch = false;
          if (systemUser.password.startsWith('$2b$')) {
            // Hashed password - use bcrypt comparison
            isMatch = await comparePasswords(password, systemUser.password);
          } else {
            // Plain text password - direct comparison (temporary for migration)
            isMatch = password === systemUser.password;
          }
          
          if (!isMatch) {
            return done(null, false, { message: "Credenciais inválidas" });
          }

          // Buscar informações de equipe
          let teamInfo = null;
          if (systemUser.teamId) {
            teamInfo = await storage.getTeam(systemUser.teamId);
          }

          const userWithTeam: Express.User = {
            id: systemUser.id,
            email: systemUser.email,
            username: systemUser.username,
            displayName: systemUser.displayName,
            role: systemUser.role,
            roleId: systemUser.roleId || 1,
            dataKey: systemUser.dataKey || undefined,
            channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
            macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
            teamId: systemUser.teamId || undefined,
            team: teamInfo?.name || undefined,
          };

          return done(null, userWithTeam);
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }

      // Buscar informações de equipe
      let teamInfo = null;
      if (user.teamId) {
        teamInfo = await storage.getTeam(user.teamId);
      }

      const userWithTeam = {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        roleId: user.roleId || 1,
        dataKey: user.dataKey || undefined,
        channels: user.channels || [],
        teams: user.teams || [],
        teamId: user.teamId,
        team: teamInfo?.name || null,
      };

      done(null, userWithTeam as any);
    } catch (error) {
      console.error("Erro ao deserializar usuário:", error);
      done(error);
    }
  });
}