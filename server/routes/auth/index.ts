import type { Express, Request, Response } from "express";
import passport from "passport";

export function registerAuthRoutes(app: Express) {
  // Health check endpoint para sessões
  app.get("/api/auth/health", (req: Request, res: Response) => {
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
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Verificação de autenticação:", {
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        hasSession: !!req.session,
        sessionData: req.session ? Object.keys(req.session) : 'no session',
        hasUser: !!req.user
      });
    }

    if (req.isAuthenticated()) {
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ Usuário autenticado:", { userId: req.user?.id, email: req.user?.email });
      }
      res.json(req.user);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log("❌ Usuário não autenticado");
      }
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

      // Import storage here to avoid circular dependencies
      const { storage } = await import("../../core/storage");
      const { hashPassword } = await import("./auth");

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe com este email" });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createSystemUser({
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
        macrosetores: [],
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