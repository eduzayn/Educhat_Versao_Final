import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("user"), // user, manager, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  profileImageUrl: text("profile_image_url"),
  location: text("location"),
  age: integer("age"),
  isOnline: boolean("is_online").default(false),
  lastSeenAt: timestamp("last_seen_at"),
  // Novos campos para identificação de canal
  canalOrigem: varchar("canal_origem", { length: 50 }), // whatsapp, instagram, facebook, etc
  nomeCanal: varchar("nome_canal", { length: 100 }), // WhatsApp Comercial, WhatsApp Suporte, etc
  idCanal: varchar("id_canal", { length: 50 }), // ID único do canal específico
  userIdentity: varchar("user_identity", { length: 100 }), // número de telefone ou email único
  assignedUserId: integer("assigned_user_id").references(() => systemUsers.id),
  tags: text("tags").array(), // Array de tags incluindo cursos detectados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(), // whatsapp, instagram, facebook
  channelId: integer("channel_id").references(() => channels.id), // specific channel instance
  status: varchar("status", { length: 20 }).default("open"), // open, pending, resolved
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  unreadCount: integer("unread_count").default(0),
  // Campos para sistema de equipes e atribuição
  macrosetor: varchar("macrosetor", { length: 20 }), // comercial, suporte, cobranca, secretaria, tutoria, financeiro, secretaria_pos
  assignedTeamId: integer("assigned_team_id").references(() => teams.id), // equipe atribuída
  assignedUserId: integer("assigned_user_id").references(() => systemUsers.id), // usuário atribuído
  assignmentMethod: varchar("assignment_method", { length: 20 }).default("automatic"), // automatic, manual
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  isFromContact: boolean("is_from_contact").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file
  metadata: jsonb("metadata"), // for attachments, etc.
  isDeleted: boolean("is_deleted").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  // Campos adicionais da Z-API
  whatsappMessageId: varchar("whatsapp_message_id", { length: 50 }), // messageId do WhatsApp
  zapiStatus: varchar("zapi_status", { length: 20 }), // PENDING, SENT, RECEIVED, READ, PLAYED
  isGroup: boolean("is_group").default(false), // se a mensagem veio de grupo
  referenceMessageId: varchar("reference_message_id", { length: 50 }), // para respostas
  // Campos para notas internas
  isInternalNote: boolean("is_internal_note").default(false), // indica se é uma nota interna
  authorId: integer("author_id").references(() => systemUsers.id), // ID do usuário que criou a nota
  authorName: varchar("author_name", { length: 100 }), // nome do autor para facilitar
  // Campo para ocultação local de mensagens
  isHiddenForUser: boolean("is_hidden_for_user").default(false), // oculta mensagem apenas localmente exibição
});

// Contact tags table
export const contactTags = pgTable("contact_tags", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  tag: varchar("tag", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quick Replies table
export const quickReplies = pgTable("quick_replies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // 'text', 'audio', 'image', 'video', 'document'
  content: text("content"), // text content or file URL
  additionalText: text("additional_text"), // additional text for media files (especially audio)
  fileUrl: text("file_url"), // for media files
  fileName: text("file_name"), // original filename
  fileSize: integer("file_size"), // file size in bytes
  mimeType: text("mime_type"), // MIME type for media files
  shortcut: text("shortcut"), // keyboard shortcut (e.g., "/hello")
  category: text("category").default("general"), // category for organization
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0), // track usage for analytics
  createdBy: varchar("created_by").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id), // for team-scoped quick replies
  isShared: boolean("is_shared").default(false), // se é compartilhada ou privada
  shareScope: varchar("share_scope", { length: 20 }).default("private"), // private, team, global
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quick Reply Shares table - para compartilhamento com usuários específicos
export const quickReplyShares = pgTable("quick_reply_shares", {
  id: serial("id").primaryKey(),
  quickReplyId: integer("quick_reply_id").references(() => quickReplies.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sharedBy: varchar("shared_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quick Reply Team Shares table - para compartilhamento com equipes
export const quickReplyTeamShares = pgTable("quick_reply_team_shares", {
  id: serial("id").primaryKey(),
  quickReplyId: integer("quick_reply_id").references(() => quickReplies.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  sharedBy: varchar("shared_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("blue"),
  macrosetor: varchar("macrosetor", { length: 20 }), // comercial, suporte, cobranca, secretaria, tutoria, financeiro, secretaria_pos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Team relationship table
export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => systemUsers.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  role: varchar("role", { length: 50 }).default("agent"), // agent, supervisor, manager
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").default('[]'), // array of permission strings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channels table (for multiple channel support)
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Ex: "WhatsApp Principal", "WhatsApp Vendas"
  type: varchar("type", { length: 50 }).notNull(), // whatsapp, instagram, facebook, email, sms
  identifier: varchar("identifier", { length: 100 }), // Phone number, account ID, etc.
  description: text("description"), // Channel description
  // WhatsApp Z-API specific fields
  instanceId: varchar("instance_id", { length: 100 }), // Z-API instance ID
  token: varchar("token", { length: 255 }), // Z-API token
  clientToken: varchar("client_token", { length: 255 }), // Z-API client token
  configuration: jsonb("configuration"), // Store additional channel-specific config
  isActive: boolean("is_active").default(true),
  isConnected: boolean("is_connected").default(false),
  lastConnectionCheck: timestamp("last_connection_check"),
  connectionStatus: varchar("connection_status", { length: 50 }).default("disconnected"), // connected, disconnected, error
  webhookUrl: text("webhook_url"), // specific webhook for this channel
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Users table (for user management settings)
export const systemUsers = pgTable("system_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  displayName: text("display_name").notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  role: varchar("role", { length: 50 }).notNull(), // 'admin', 'manager', 'agent', 'viewer'
  teamId: integer("team_id").references(() => teams.id),
  team: varchar("team", { length: 100 }),
  dataKey: varchar("data_key", { length: 200 }), // ex: "zayn", "zayn.piracema", "zayn.piracema.tutoria"
  channels: jsonb("channels").default([]), // array of channels user can access
  macrosetores: jsonb("macrosetores").default([]), // array of macrosetores user can access
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, blocked
  lastLoginAt: timestamp("last_login_at"),
  lastActivityAt: timestamp("last_activity_at"),
  avatar: text("avatar"),
  initials: varchar("initials", { length: 5 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact notes table for internal annotations
export const contactNotes = pgTable("contact_notes", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  content: text("content").notNull(),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorId: varchar("author_id"),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deals table for CRM
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  macrosetor: varchar("macrosetor", { length: 20 }).notNull().default("comercial"), // comercial, suporte, cobranca, secretaria, tutoria, financeiro, secretaria_pos
  stage: varchar("stage", { length: 50 }).notNull().default("prospecting"), // varia por macrosetor
  value: integer("value").default(0), // valor em centavos
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  owner: varchar("owner", { length: 100 }),
  assignedUserId: integer("assigned_user_id").references(() => systemUsers.id),
  createdByUserId: integer("created_by_user_id").references(() => systemUsers.id),
  canalOrigem: varchar("canal_origem", { length: 50 }), // whatsapp, instagram, etc
  tags: jsonb("tags").default([]), // array de strings
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const contactsRelations = relations(contacts, ({ many }) => ({
  conversations: many(conversations),
  tags: many(contactTags),
  notes: many(contactNotes),
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
}));

export const contactNotesRelations = relations(contactNotes, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactNotes.contactId],
    references: [contacts.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [conversations.contactId],
    references: [contacts.id],
  }),
  channel: one(channels, {
    fields: [conversations.channelId],
    references: [channels.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const contactTagsRelations = relations(contactTags, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactTags.contactId],
    references: [contacts.id],
  }),
}));

export const quickRepliesRelations = relations(quickReplies, ({ one }) => ({
  creator: one(users, {
    fields: [quickReplies.createdBy],
    references: [users.id],
  }),
}));

export const systemUsersRelations = relations(systemUsers, ({ one }) => ({
  roleRef: one(roles, {
    fields: [systemUsers.roleId],
    references: [roles.id],
  }),
  teamRef: one(teams, {
    fields: [systemUsers.teamId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(systemUsers),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(systemUsers),
}));

export const channelsRelations = relations(channels, ({ many }) => ({
  conversations: many(conversations),
}));

// Insert schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  deliveredAt: true,
  readAt: true,
});

export const insertContactTagSchema = createInsertSchema(contactTags).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});



export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({
  id: true,
  isOnline: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastConnectionCheck: true,
});

export const insertContactNoteSchema = createInsertSchema(contactNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Custom User interface for authentication compatibility
export interface User {
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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ContactTag = typeof contactTags.$inferSelect;
export type InsertContactTag = z.infer<typeof insertContactTagSchema>;
export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type ContactNote = typeof contactNotes.$inferSelect;
export type InsertContactNote = z.infer<typeof insertContactNoteSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

// Extended types for API responses
export type ConversationWithContact = Conversation & {
  contact: Contact;
  channelInfo?: Channel;
  messages: Message[];
  _count?: {
    messages: number;
  };
};

export type ContactWithTags = Contact & {
  contactTags: ContactTag[];
};

export const insertQuickReplySchema = createInsertSchema(quickReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;

export const insertQuickReplyShareSchema = createInsertSchema(quickReplyShares).omit({
  id: true,
  createdAt: true,
});

export const insertQuickReplyTeamShareSchema = createInsertSchema(quickReplyTeamShares).omit({
  id: true,
  createdAt: true,
});

export type QuickReplyShare = typeof quickReplyShares.$inferSelect;
export type InsertQuickReplyShare = z.infer<typeof insertQuickReplyShareSchema>;
export type QuickReplyTeamShare = typeof quickReplyTeamShares.$inferSelect;
export type InsertQuickReplyTeamShare = z.infer<typeof insertQuickReplyTeamShareSchema>;

export const insertUserTeamSchema = createInsertSchema(userTeams).omit({
  id: true,
  joinedAt: true,
});

export type UserTeam = typeof userTeams.$inferSelect;
export type InsertUserTeam = z.infer<typeof insertUserTeamSchema>;

export type QuickReplyWithCreator = QuickReply & {
  creator?: User;
  sharedUsers?: User[];
  sharedTeams?: Team[];
};

// Permissions table - granular permissions system
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(), // ex: "conversa:atribuir", "relatorio:ver"
  resource: varchar("resource", { length: 50 }).notNull(), // ex: "conversa", "relatorio", "canal"
  action: varchar("action", { length: 50 }).notNull(), // ex: "atribuir", "ver", "editar"
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"), // general, admin, operations
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role-Permission relationship table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom rules for ABAC (Attribute-Based Access Control)
export const customRules = pgTable("custom_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  userId: integer("user_id").references(() => systemUsers.id),
  roleId: integer("role_id").references(() => roles.id),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  conditions: jsonb("conditions"), // JSON with conditions like channel, macrosetor, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs for sensitive actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => systemUsers.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 50 }),
  channel: varchar("channel", { length: 50 }),
  macrosetor: varchar("macrosetor", { length: 20 }),
  dataKey: varchar("data_key", { length: 200 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  result: varchar("result", { length: 20 }).default("success"), // success, failure, unauthorized
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings table for controlling various features
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value").notNull(),
  type: varchar("type", { length: 20 }).default("string"), // string, boolean, number, json
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"), // general, ai, integrations, security
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for system settings
// Schemas for new permission tables
export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertCustomRuleSchema = createInsertSchema(customRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new permission tables
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type CustomRule = typeof customRules.$inferSelect;
export type InsertCustomRule = z.infer<typeof insertCustomRuleSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Relations for new permission tables
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  customRules: many(customRules),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const customRulesRelations = relations(customRules, ({ one }) => ({
  user: one(systemUsers, {
    fields: [customRules.userId],
    references: [systemUsers.id],
  }),
  role: one(roles, {
    fields: [customRules.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [customRules.permissionId],
    references: [permissions.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(systemUsers, {
    fields: [auditLogs.userId],
    references: [systemUsers.id],
  }),
}));

// Extended types for complex queries
export type RoleWithPermissions = Role & {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
};

export type UserWithPermissions = SystemUser & {
  roleInfo?: Role;
  customRules: (CustomRule & {
    permission: Permission;
  })[];
};
