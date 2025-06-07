import type { Express, Request, Response } from "express";
import passport from "passport";

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/login", passport.authenticate("local"), (req: Request, res: Response) => {
    res.json(req.user);
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
    if (req.isAuthenticated()) {
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
        dataKey: newUser.dataKey,
        channels: [],
        macrosetores: [],
        teamId: newUser.teamId,
        team: null
      };

      // Log the user in automatically
      req.login(userForLogin, (err) => {
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