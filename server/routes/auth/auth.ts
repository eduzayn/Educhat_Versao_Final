import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "../../core/db";
import { storage } from "../../storage";

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
      teams: string[];
      teamTypes: string[];
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

export function setupAuthWithRoutes(app: Express) {
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
            teams: Array.isArray(systemUser.teams) ? systemUser.teams : [],
            teamTypes: Array.isArray(systemUser.teams) ? systemUser.teams : [],
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
        channels: Array.isArray(user.channels) ? user.channels : [],
        teams: Array.isArray(user.teams) ? user.teams : [],
        teamTypes: Array.isArray(user.teams) ? user.teams : [],
        teamId: user.teamId,
        team: teamInfo?.name || null,
      };

      done(null, userWithTeam as any);
    } catch (error) {
      console.error("Erro ao deserializar usuário:", error);
      done(error);
    }
  });

  // ==================== AUTHENTICATION ROUTES ====================
  
  // Health check endpoint para sessões
  app.get("/api/auth-health", (req: Request, res: Response) => {
    const sessionHealth = {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      environment: process.env.NODE_ENV,
      protocol: req.protocol,
      secure: req.secure,
      host: req.get('host'),
      userAgent: req.get('User-Agent'),
      cookies: {
        hasCookieHeader: !!req.headers.cookie,
        cookieCount: req.headers.cookie ? req.headers.cookie.split(';').length : 0
      },
      sessionStore: {
        connected: !!req.sessionStore
      }
    };
    
    console.log("🏥 Health check de autenticação:", sessionHealth);
    res.json(sessionHealth);
  });

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response, next) => {
    try {
      console.log("🔐 Tentativa de login recebida:", { 
        email: req.body.email, 
        hasPassword: !!req.body.password,
        environment: process.env.NODE_ENV,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        headers: {
          host: req.get('host'),
          origin: req.get('origin'),
          referer: req.get('referer'),
          cookie: !!req.headers.cookie
        }
      });

      // Verificar se os dados necessários estão presentes
      if (!req.body.email || !req.body.password) {
        console.log("❌ Dados de login incompletos");
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Usar passport para autenticação
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("❌ Erro na autenticação:", err);
          console.error("Stack trace:", err.stack);
          return res.status(500).json({ message: "Erro interno no servidor durante autenticação" });
        }
        
        if (!user) {
          console.log("❌ Falha na autenticação:", info?.message || "Usuário não encontrado");
          return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("❌ Erro ao estabelecer sessão:", loginErr);
            console.error("Session error stack:", loginErr.stack);
            return res.status(500).json({ message: "Erro ao estabelecer sessão de usuário" });
          }
          
          console.log("✅ Login realizado com sucesso:", { 
            userId: user.id, 
            email: user.email,
            sessionId: req.sessionID,
            sessionSaved: !!req.session
          });
          
          res.json(user);
        });
      })(req, res, next);
    } catch (error) {
      console.error("❌ Erro crítico no endpoint de login:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Erro interno crítico do servidor" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req: Request, res: Response) => {
    const isAuthenticated = req.isAuthenticated();
    
    // Debug apenas quando há falha de autenticação
    if (!isAuthenticated && process.env.NODE_ENV === 'development') {
      console.log("🔍 Debug de sessão:", {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        cookies: !!req.headers.cookie
      });
    }

    if (isAuthenticated) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Não autenticado" });
    }
  });

  // Register endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        username: email,
        displayName: `${firstName} ${lastName}`,
        role: "user",
        roleId: 1,
        isActive: true
      });

      // Create user object for login
      const userForLogin = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
        roleId: newUser.roleId || 1,
        dataKey: newUser.dataKey || undefined,
        channels: [],
        teams: [],
        teamId: newUser.teamId,
        team: null
      };

      // Log the user in automatically
      req.login(userForLogin as any, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login automático" });
        }
        res.json(userForLogin);
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}