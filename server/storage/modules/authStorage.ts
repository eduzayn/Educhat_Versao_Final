import { BaseStorage } from "../base/BaseStorage";
import { systemUsers, userTeams, conversations, messages, deals, contacts, type User, type UpsertUser, type SystemUser, type InsertSystemUser } from "../../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Auth storage module - manages user authentication operations
 */
export class AuthStorage extends BaseStorage {
  /**
   * Get user by ID for authentication
   */
  async getUser(id: string): Promise<User | undefined> {
    const [systemUser] = await this.db.select().from(systemUsers).where(eq(systemUsers.id, parseInt(id)));
    if (!systemUser) return undefined;
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      teamTypes: [], // Sistema de equipes baseado em tipos
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  /**
   * Get user by email for login
   */
  async getUserByEmail(email: string): Promise<SystemUser | undefined> {
    const [systemUser] = await this.db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return systemUser;
  }

  /**
   * Create new user
   */
  async createUser(userData: UpsertUser): Promise<User> {
    const [systemUser] = await this.db
      .insert(systemUsers)
      .values({
        email: userData.email,
        username: userData.firstName || userData.email.split('@')[0],
        displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
        password: userData.password,
        role: userData.role || 'user',
        roleId: 1,
        isActive: true,
        channels: []
      })
      .returning();
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      teamTypes: [], // Sistema de equipes baseado em tipos
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  /**
   * Upsert user (create or update)
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Update existing user
      const [updated] = await this.db
        .update(systemUsers)
        .set({
          username: userData.firstName || userData.email.split('@')[0],
          displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
          password: userData.password,
          role: userData.role || existingUser.role,
          updatedAt: new Date()
        })
        .where(eq(systemUsers.id, existingUser.id))
        .returning();
      
      return {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        roleId: updated.roleId || 1,
        dataKey: updated.dataKey || undefined,
        channels: Array.isArray(updated.channels) ? updated.channels : [],
        teamTypes: [], // Sistema de equipes baseado em tipos
        teamId: updated.teamId || undefined,
        team: updated.team || undefined
      };
    } else {
      // Create new user
      return this.createUser(userData);
    }
  }

  // System User operations
  async getSystemUsers(): Promise<SystemUser[]> {
    return this.db.select().from(systemUsers);
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await this.db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await this.db.insert(systemUsers).values(user).returning();
    return newUser;
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    const [updatedUser] = await this.db
      .update(systemUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteSystemUser(id: number): Promise<void> {
    console.log(`🔧 AuthStorage.deleteSystemUser iniciado para ID: ${id}`);
    
    try {
      // 1. Remover atribuições de conversas (definir assigned_user_id como NULL)
      console.log(`🔧 Removendo atribuições de conversas para usuário ${id}...`);
      const updatedConversations = await this.db
        .update(conversations)
        .set({ assignedUserId: null })
        .where(eq(conversations.assignedUserId, id));
      console.log(`✅ Atribuições de conversas removidas:`, updatedConversations);
      
      // 2. Remover referências nas mensagens (definir author_id como NULL para notas internas)
      console.log(`🔧 Removendo referências do usuário em mensagens...`);
      const updatedMessages = await this.db
        .update(messages)
        .set({ authorId: null })
        .where(eq(messages.authorId, id));
      console.log(`✅ Referências em mensagens removidas:`, updatedMessages);
      
      // 3. Remover atribuições de deals (definir assigned_user_id e created_by_user_id como NULL)
      console.log(`🔧 Removendo atribuições de deals...`);
      const updatedDealsAssigned = await this.db
        .update(deals)
        .set({ assignedUserId: null })
        .where(eq(deals.assignedUserId, id));
      const updatedDealsCreated = await this.db
        .update(deals)
        .set({ createdByUserId: null })
        .where(eq(deals.createdByUserId, id));
      console.log(`✅ Atribuições de deals removidas:`, { assigned: updatedDealsAssigned, created: updatedDealsCreated });
      
      // 4. Remover atribuições de contatos (definir assigned_user_id como NULL)
      console.log(`🔧 Removendo atribuições de contatos...`);
      const updatedContacts = await this.db
        .update(contacts)
        .set({ assignedUserId: null })
        .where(eq(contacts.assignedUserId, id));
      console.log(`✅ Atribuições de contatos removidas:`, updatedContacts);
      
      // 5. Remover relacionamentos de equipes do usuário
      console.log(`🔧 Removendo relacionamentos de equipes...`);
      const deletedTeamRelations = await this.db.delete(userTeams).where(eq(userTeams.userId, id));
      console.log(`✅ Relacionamentos de equipes removidos:`, deletedTeamRelations);
      
      // 6. Por último, excluir o usuário
      console.log(`🔧 Excluindo usuário ${id} da tabela system_users...`);
      const deletedUser = await this.db.delete(systemUsers).where(eq(systemUsers.id, id));
      console.log(`✅ Usuário excluído com sucesso:`, deletedUser);
    } catch (error) {
      console.error(`🔥 Erro em AuthStorage.deleteSystemUser para ID ${id}:`, error);
      throw error;
    }
  }
}