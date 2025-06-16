import { Express } from "express";
import { setupSession } from "./session";
import { setupPassport } from "./passport";
import { setupAuthRoutes } from "./routes";

export function setupAuthWithRoutes(app: Express) {
  // Configurar sessão
  setupSession(app);

  // Configurar Passport
  setupPassport(app);

  // Configurar rotas de autenticação
  setupAuthRoutes(app);
}

// Re-exportar funções úteis
export { hashPassword, comparePasswords } from "./password"; 