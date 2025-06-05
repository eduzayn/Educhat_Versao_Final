import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { systemUsers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { PermissionService } from "./permissions";

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
      teamId?: number;
      team?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configurar CORS para permitir credenciais
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Para desenvolvimento, permitir todas as origens, mas para produção deve ser específico
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cookie');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'educhat-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // false para desenvolvimento, true para produção com HTTPS
      httpOnly: false, // permitir acesso via JS para desenvolvimento
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log('🔐 Tentativa de login:', { email: email, hasPassword: !!password });
          
          // Buscar na tabela system_users diretamente
          const userResult = await db
            .select({
              id: systemUsers.id,
              email: systemUsers.email,
              username: systemUsers.username,
              displayName: systemUsers.displayName,
              password: systemUsers.password,
              role: systemUsers.role,
              roleId: systemUsers.roleId,
              dataKey: systemUsers.dataKey,
              channels: systemUsers.channels,
              macrosetores: systemUsers.macrosetores,
              teamId: systemUsers.teamId,
              team: systemUsers.team,
              isActive: systemUsers.isActive,
              status: systemUsers.status
            })
            .from(systemUsers)
            .where(and(
              eq(systemUsers.email, email),
              eq(systemUsers.isActive, true),
              eq(systemUsers.status, 'active')
            ))
            .limit(1);

          const user = userResult[0];
          
          console.log('👤 Usuário encontrado:', !!user);
          
          if (!user) {
            console.log('❌ Usuário não encontrado');
            return done(null, false, { message: 'Email ou senha incorretos' });
          }
          
          // Verificar senha - primeiro tenta hash, depois texto plano para compatibilidade
          let isValidPassword = false;
          try {
            isValidPassword = await comparePasswords(password, user.password);
            console.log('🔑 Verificação de senha hash:', isValidPassword);
          } catch (error) {
            // Se falha na comparação hash, tenta texto plano (para senhas não hasheadas)
            isValidPassword = password === user.password;
            console.log('🔑 Verificação de senha plana:', isValidPassword);
          }
          
          if (!isValidPassword) {
            console.log('❌ Senha incorreta');
            return done(null, false, { message: 'Email ou senha incorretos' });
          }
          
          console.log('✅ Login bem-sucedido para:', user.email);
          // Formatar usuário para compatibilidade com interface User
          const formattedUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            roleId: user.roleId || 1,
            dataKey: user.dataKey,
            channels: Array.isArray(user.channels) ? user.channels : [],
            macrosetores: Array.isArray(user.macrosetores) ? user.macrosetores : [],
            teamId: user.teamId,
            team: user.team
          };
          return done(null, formattedUser);
        } catch (error) {
          console.error('🚨 Erro na autenticação:', error);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await db.select().from(systemUsers).where(eq(systemUsers.id, parseInt(id))).limit(1);
      const user = result[0];
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('❌ Erro na deserialização do usuário:', error);
      done(error);
    }
  });

  // Registro de usuário
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Validar dados
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Senha deve ter pelo menos 6 caracteres" });
      }

      // Criar usuário
      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
      });

      // Fazer login automático após registro
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        });
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login de usuário
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro interno do servidor" });
        }
        res.json({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          team: user.team,
        });
      });
    })(req, res, next);
  });

  // Logout de usuário
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Verificar usuário atual
  app.get("/api/user", (req, res) => {
    console.log('🔍 Verificando autenticação:', {
      isAuthenticated: req.isAuthenticated(),
      session: req.session?.id,
      user: req.user ? 'presente' : 'ausente'
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    res.json(req.user);
  });
}