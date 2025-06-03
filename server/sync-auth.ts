import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, systemUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function syncSystemUserToAuthUser(systemUserId: number) {
  try {
    // Buscar o usuário do sistema
    const [systemUser] = await db.select().from(systemUsers).where(eq(systemUsers.id, systemUserId));
    
    if (!systemUser) {
      throw new Error("System user not found");
    }

    // Verificar se já existe um usuário de autenticação
    const [existingUser] = await db.select().from(users).where(eq(users.email, systemUser.email));
    
    const hashedPassword = await hashPassword(systemUser.password);
    
    if (existingUser) {
      // Atualizar usuário existente
      await db.update(users)
        .set({
          password: hashedPassword,
          firstName: systemUser.displayName.split(' ')[0] || systemUser.displayName,
          lastName: systemUser.displayName.split(' ').slice(1).join(' ') || '',
          profileImageUrl: systemUser.avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
      
      return existingUser.id;
    } else {
      // Criar novo usuário de autenticação
      const [newUser] = await db.insert(users).values({
        id: `sys_${systemUser.id}`,
        email: systemUser.email,
        password: hashedPassword,
        firstName: systemUser.displayName.split(' ')[0] || systemUser.displayName,
        lastName: systemUser.displayName.split(' ').slice(1).join(' ') || '',
        profileImageUrl: systemUser.avatar,
      }).returning();
      
      return newUser.id;
    }
  } catch (error) {
    console.error("Error syncing system user to auth user:", error);
    throw error;
  }
}