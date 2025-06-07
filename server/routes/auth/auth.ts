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

export function setupAuth(app: Express) {
  const PgSession = ConnectPgSimple(session);
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "user_sessions",
      }),
      secret: process.env.SESSION_SECRET || "educhat-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      },
    }),
  );

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

          const userWithTeam = {
            id: systemUser.id,
            email: systemUser.email,
            username: systemUser.username,
            displayName: systemUser.displayName,
            role: systemUser.role,
            roleId: systemUser.roleId || 1,
            dataKey: systemUser.dataKey || undefined,
            channels: systemUser.channels || [],
            macrosetores: systemUser.macrosetores || [],
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
      const user = await storage.getSystemUser(id);
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
        macrosetores: user.macrosetores || [],
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