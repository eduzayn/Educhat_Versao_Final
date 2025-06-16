import { Express, Request, Response } from "express";
import passport from "passport";
import { hashPassword } from "./password";
import { storage } from "../../storage";

export function setupAuthRoutes(app: Express) {
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

    res.json(sessionHealth);
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Erro no login:", err);
        return res.status(500).json({ message: "Erro interno do servidor" });
      }

      if (!user) {
        return res.status(401).json({ message: info.message || "Credenciais inválidas" });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Erro ao fazer login:", err);
          return res.status(500).json({ message: "Erro ao fazer login" });
        }

        // Atualizar último login
        storage.updateUserLastLogin(user.id).catch(console.error);

        res.json({
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            roleId: user.roleId,
            dataKey: user.dataKey,
            channels: user.channels,
            teams: user.teams,
            teamTypes: user.teamTypes,
            teamId: user.teamId,
            team: user.team
          }
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Erro ao fazer logout:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Erro ao destruir sessão:", err);
          return res.status(500).json({ message: "Erro ao destruir sessão" });
        }

        res.clearCookie("educhat-session");
        res.json({ message: "Logout realizado com sucesso" });
      });
    });
  });

  // Verificar autenticação
  app.get("/api/auth/check", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        displayName: req.user.displayName,
        role: req.user.role,
        roleId: req.user.roleId,
        dataKey: req.user.dataKey,
        channels: req.user.channels,
        teams: req.user.teams,
        teamTypes: req.user.teamTypes,
        teamId: req.user.teamId,
        team: req.user.team
      }
    });
  });

  // Registrar novo usuário
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, username, password, displayName } = req.body;

      if (!email || !username || !password || !displayName) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      // Verificar se email já existe
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Verificar se username já existe
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }

      // Hash da senha
      const passwordHash = await hashPassword(password);

      // Criar usuário
      const newUser = await storage.createUser({
        email,
        username,
        password: passwordHash,
        displayName,
        role: "user",
        roleId: 1,
        isActive: true,
        status: "active"
      });

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          displayName: newUser.displayName,
          role: newUser.role,
          roleId: newUser.roleId
        }
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
} 