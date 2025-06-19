import { Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "../../storage/index";
import { comparePasswords } from "./password";

export function setupPassport(app: Express) {
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
          const team = systemUser.teamId ? await storage.getTeam(systemUser.teamId) : null;

          const userWithTeam: Express.User = {
            id: systemUser.id,
            email: systemUser.email,
            username: systemUser.username,
            displayName: systemUser.displayName,
            role: systemUser.role,
            roleId: systemUser.roleId || 1,
            dataKey: systemUser.dataKey || undefined,
            channels: systemUser.channels || [],
            teams: team?.name ? [team.name] : [],
            teamTypes: team?.teamType ? [team.teamType] : [],
            teamId: systemUser.teamId || undefined,
            team: team?.name || undefined,
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

      const team = user.teamId ? await storage.getTeam(user.teamId) : null;

      const userWithTeam = {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        roleId: user.roleId || 1,
        dataKey: user.dataKey,
        channels: user.channels || [],
        teams: team?.name ? [team.name] : [],
        teamTypes: team?.teamType ? [team.teamType] : [],
        teamId: user.teamId,
        team: team?.name || null,
      };

      done(null, userWithTeam as any);
    } catch (error) {
      console.error("Erro ao deserializar usuário:", error);
      done(error);
    }
  });
} 