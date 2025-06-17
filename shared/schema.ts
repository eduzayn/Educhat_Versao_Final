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

// DEPRECATED: User storage table for auth - Use systemUsers instead
// This table is kept for backward compatibility but should be phased out
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
  // Campos para cache de avatar
  avatarCacheUrl: text("avatar_cache_url"), // URL da imagem em cache
  avatarLastFetch: timestamp("avatar_last_fetch"), // Última tentativa de busca
  avatarFetchAttempts: integer("avatar_fetch_attempts").default(0), // Contador de tentativas
  hasValidAvatar: boolean("has_valid_avatar").default(false), // Se tem avatar válido
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
  teamType: varchar("team_type", { length: 20 }), // comercial, suporte, cobranca, secretaria, tutoria, financeiro, secretaria_pos
  assignedTeamId: integer("assigned_team_id").references(() => teams.id), // equipe atribuída
  assignedUserId: integer("assigned_user_id").references(() => systemUsers.id), // usuário atribuído
  assignmentMethod: varchar("assignment_method", { length: 20 }).default("automatic"), // automatic, manual
  assignedAt: timestamp("assigned_at"),
  // Campos adicionais para compatibilidade
  isRead: boolean("is_read").default(false),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
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
  noteType: varchar("note_type", { length: 20 }).default("general"), // general, reminder, important, follow_up
  notePriority: varchar("note_priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  noteTags: text("note_tags").array(), // tags para categorização
  isPrivate: boolean("is_private").default(false), // se a nota é privada para o autor
  // Campo para ocultação local de mensagens
  isHiddenForUser: boolean("is_hidden_for_user").default(false), // oculta mensagem apenas localmente exibição
  // Campo para indicar que mensagem foi deletada pelo usuário (mas deve mostrar placeholder)
  isDeletedByUser: boolean("is_deleted_by_user").default(false), // mensagem deletada mas deve mostrar "Esta mensagem foi apagada"
  deletedAt: timestamp("deleted_at"), // quando foi deletada
  deletedBy: integer("deleted_by").references(() => systemUsers.id), // ID do usuário que deletou a mensagem
}, (table) => [
  // 🚀 ÍNDICES CRÍTICOS PARA PERFORMANCE DE MENSAGENS
  index("idx_messages_conversation_deleted_sent").on(table.conversationId, table.isDeleted, table.sentAt),
  index("idx_messages_conversation_sent").on(table.conversationId, table.sentAt),
  index("idx_messages_whatsapp_id").on(table.whatsappMessageId),
  index("idx_messages_deleted_by").on(table.deletedBy),
]);

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

// Teams table (unified team management)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("blue"),
  teamType: varchar("team_type", { length: 20 }).unique().notNull(), // comercial, suporte, cobranca, secretaria, tutoria, financeiro, secretaria_pos
  isActive: boolean("is_active").default(true),
  maxCapacity: integer("max_capacity").default(100), // Maximum concurrent conversations
  priority: integer("priority").default(1), // For distribution priority
  workingHours: jsonb("working_hours"), // Working hours configuration
  autoAssignment: boolean("auto_assignment").default(true), // Enable automatic assignment
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

// Main Users table (unified user management)
// This is now the primary table for all user operations
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
  teamTypes: jsonb("team_types").default([]), // array of team types user can access
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

// Alias for backward compatibility - systemUsers is the main table
export const mainUsers = systemUsers;

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

// Funnels table for CRM - define funis por equipe
export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome do funil
  teamType: varchar("team_type", { length: 20 }).notNull().unique(), // tipo de equipe único
  teamId: integer("team_id").references(() => teams.id), // equipe associada
  stages: jsonb("stages").notNull().$type<{
    id: string;
    name: string;
    order: number;
    color?: string;
    probability?: number;
  }[]>(), // estágios do funil
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deals table for CRM
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  teamType: varchar("team_type", { length: 20 }).notNull().default("comercial"), // referencia funnels.teamType
  funnelId: integer("funnel_id").references(() => funnels.id), // referencia direta ao funil da equipe
  stage: varchar("stage", { length: 50 }).notNull().default("prospecting"), // referencia stages do funil
  value: integer("value").default(0), // valor em centavos
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  owner: varchar("owner", { length: 100 }),
  assignedUserId: integer("assigned_user_id").references(() => systemUsers.id),
  createdByUserId: integer("created_by_user_id").references(() => systemUsers.id),
  canalOrigem: varchar("canal_origem", { length: 50 }), // whatsapp, instagram, etc
  category: varchar("category", { length: 100 }), // categoria do curso (Graduação, Pós-graduação, etc)
  course: varchar("course", { length: 200 }), // curso de interesse específico
  tags: jsonb("tags").default([]), // array de strings
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para logs de handoffs/transferências
export const handoffs = pgTable("handoffs", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  fromUserId: integer("from_user_id").references(() => systemUsers.id),
  toUserId: integer("to_user_id").references(() => systemUsers.id),
  fromTeamId: integer("from_team_id").references(() => teams.id),
  toTeamId: integer("to_team_id").references(() => teams.id),
  type: varchar("type", { length: 20 }).notNull(), // manual, automatic, escalation
  reason: text("reason"),
  priority: varchar("priority", { length: 10 }).default("normal"), // low, normal, high, urgent
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, rejected, completed
  aiClassification: jsonb("ai_classification").$type<{
    confidence: number;
    suggestedTeam?: string;
    urgency: string;
    frustrationLevel: number;
    intent: string;
  }>(),
  metadata: jsonb("metadata").$type<{
    triggerEvent?: string;
    escalationReason?: string;
    customerSentiment?: string;
    previousHandoffs?: number;
  }>(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para armazenamento de mídia no banco (produção-ready)
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  fileData: text("file_data").notNull(), // base64 encoded file
  mediaType: varchar("media_type", { length: 20 }).notNull(), // image, video, audio, document
  isCompressed: boolean("is_compressed").default(false),
  compressionQuality: integer("compression_quality"), // 1-100 for images/videos
  duration: integer("duration"), // seconds for audio/video
  dimensions: jsonb("dimensions").$type<{
    width?: number;
    height?: number;
  }>(), // for images/videos
  zapiSent: boolean("zapi_sent").default(false), // if sent via Z-API
  zapiMessageId: varchar("zapi_message_id", { length: 100 }), // Z-API message ID
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

export const handoffsRelations = relations(handoffs, ({ one }) => ({
  conversation: one(conversations, {
    fields: [handoffs.conversationId],
    references: [conversations.id],
  }),
  fromUser: one(systemUsers, {
    fields: [handoffs.fromUserId],
    references: [systemUsers.id],
  }),
  toUser: one(systemUsers, {
    fields: [handoffs.toUserId],
    references: [systemUsers.id],
  }),
  fromTeam: one(teams, {
    fields: [handoffs.fromTeamId],
    references: [teams.id],
  }),
  toTeam: one(teams, {
    fields: [handoffs.toTeamId],
    references: [teams.id],
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

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  mediaFiles: many(mediaFiles),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  message: one(messages, {
    fields: [mediaFiles.messageId],
    references: [messages.id],
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
  teams: string[];
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

export const insertHandoffSchema = createInsertSchema(handoffs).omit({
  id: true,
  acceptedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Handoff = typeof handoffs.$inferSelect;
export type InsertHandoff = z.infer<typeof insertHandoffSchema>;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

// Extended types for API responses
export type ConversationWithContact = Conversation & {
  contact: Contact & {
    tags: string[];
    deals: Deal[];
  };
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

export const insertQuickReplyShareSchema = createInsertSchema(quickReplyShares).omit({
  id: true,
  createdAt: true,
});

export const insertQuickReplyTeamShareSchema = createInsertSchema(quickReplyTeamShares).omit({
  id: true,
  createdAt: true,
});

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;

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
  conditions: jsonb("conditions"), // JSON with conditions like channel, team, etc.
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
  team: varchar("team", { length: 20 }),
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

// Internal Chat Tables
export const internalChatChannels = pgTable("internal_chat_channels", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // 'direct', 'team', 'general'
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  teamId: integer("team_id").references(() => teams.id, { onDelete: 'cascade' }),
  createdBy: integer("created_by").references(() => systemUsers.id),
  participantIds: integer("participant_ids").array(), // Para canais diretos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const internalChatMessages = pgTable("internal_chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => internalChatChannels.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => systemUsers.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default('text'), // 'text', 'audio', 'file'
  metadata: jsonb("metadata").default('{}'),
  replyToId: integer("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  reactions: jsonb("reactions").default('{}'),
  readBy: jsonb("read_by").default('[]'), // Array de user IDs que leram
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Documents table for document management
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  format: varchar("format", { length: 10 }).notNull(), // pdf, doc, docx, txt, md
  size: integer("size").notNull(),
  userId: varchar("user_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manychat Integrations table
export const manychatIntegrations = pgTable("manychat_integrations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(false),
  syncEnabled: boolean("sync_enabled").default(true),
  leadSyncEnabled: boolean("lead_sync_enabled").default(true),
  enrollmentSyncEnabled: boolean("enrollment_sync_enabled").default(true),
  notificationSyncEnabled: boolean("notification_sync_enabled").default(false),
  configuration: jsonb("configuration").default('{}'), // stores additional settings
  lastTestAt: timestamp("last_test_at"),
  lastSyncAt: timestamp("last_sync_at"),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manychat Webhook Logs table for debugging
export const manychatWebhookLogs = pgTable("manychat_webhook_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => manychatIntegrations.id),
  webhookType: varchar("webhook_type", { length: 50 }), // lead_capture, enrollment_notification, etc
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  contactId: integer("contact_id").references(() => contacts.id),
  conversationId: integer("conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for Manychat integration
export const insertManychatIntegrationSchema = createInsertSchema(manychatIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManychatWebhookLogSchema = createInsertSchema(manychatWebhookLogs).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Funnels
export const insertFunnelSchema = createInsertSchema(funnels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Funnels
export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = z.infer<typeof insertFunnelSchema>;

// Types for Manychat integration
export type ManychatIntegration = typeof manychatIntegrations.$inferSelect;
export type InsertManychatIntegration = z.infer<typeof insertManychatIntegrationSchema>;
export type ManychatWebhookLog = typeof manychatWebhookLogs.$inferSelect;
export type InsertManychatWebhookLog = z.infer<typeof insertManychatWebhookLogSchema>;

// Relations for Manychat integration
export const manychatIntegrationsRelations = relations(manychatIntegrations, ({ many }) => ({
  webhookLogs: many(manychatWebhookLogs),
}));

export const manychatWebhookLogsRelations = relations(manychatWebhookLogs, ({ one }) => ({
  integration: one(manychatIntegrations, {
    fields: [manychatWebhookLogs.integrationId],
    references: [manychatIntegrations.id],
  }),
  contact: one(contacts, {
    fields: [manychatWebhookLogs.contactId],
    references: [contacts.id],
  }),
  conversation: one(conversations, {
    fields: [manychatWebhookLogs.conversationId],
    references: [conversations.id],
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

// Facebook/Instagram Integration Tables
export const facebookIntegrations = pgTable("facebook_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  appId: text("app_id").notNull(),
  appSecret: text("app_secret").notNull(),
  accessToken: text("access_token"),
  pageId: text("page_id"),
  pageName: text("page_name"),
  instagramAccountId: text("instagram_account_id"),
  instagramUsername: text("instagram_username"),
  webhookVerifyToken: text("webhook_verify_token").notNull(),
  isActive: boolean("is_active").default(false),
  messengerEnabled: boolean("messenger_enabled").default(true),
  instagramEnabled: boolean("instagram_enabled").default(true),
  commentsEnabled: boolean("comments_enabled").default(true),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSync: timestamp("last_sync"),
  configuration: jsonb("configuration").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const facebookWebhookLogs = pgTable("facebook_webhook_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => facebookIntegrations.id, { onDelete: 'cascade' }),
  webhookType: text("webhook_type").notNull(), // 'message', 'comment', 'mention'
  platform: text("platform").notNull(), // 'facebook', 'instagram'
  senderId: text("sender_id"),
  recipientId: text("recipient_id"),
  messageId: text("message_id"),
  conversationId: text("conversation_id"),
  content: text("content"),
  messageType: text("message_type"), // 'text', 'image', 'video', 'sticker'
  attachments: jsonb("attachments").default('[]'),
  processed: boolean("processed").default(false),
  contactId: integer("contact_id"),
  conversationContactId: integer("conversation_contact_id"),
  rawData: jsonb("raw_data").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas for Facebook integration
export const insertFacebookIntegrationSchema = createInsertSchema(facebookIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookWebhookLogSchema = createInsertSchema(facebookWebhookLogs).omit({
  id: true,
  createdAt: true,
});

// Types for Facebook integration
export type FacebookIntegration = typeof facebookIntegrations.$inferSelect;
export type InsertFacebookIntegration = z.infer<typeof insertFacebookIntegrationSchema>;
export type FacebookWebhookLog = typeof facebookWebhookLogs.$inferSelect;
export type InsertFacebookWebhookLog = z.infer<typeof insertFacebookWebhookLogSchema>;

// Relations for Facebook integration
export const facebookIntegrationsRelations = relations(facebookIntegrations, ({ many }) => ({
  webhookLogs: many(facebookWebhookLogs),
}));

export const facebookWebhookLogsRelations = relations(facebookWebhookLogs, ({ one }) => ({
  integration: one(facebookIntegrations, {
    fields: [facebookWebhookLogs.integrationId],
    references: [facebookIntegrations.id],
  }),
  contact: one(contacts, {
    fields: [facebookWebhookLogs.contactId],
    references: [contacts.id],
  }),
  conversation: one(conversations, {
    fields: [facebookWebhookLogs.conversationContactId],
    references: [conversations.id],
  }),
}));

// Sistema de Detecção de Equipes
export const teamDetection = pgTable("team_detection", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamDetectionKeywords = pgTable("team_detection_keywords", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  teamDetectionId: integer("team_detection_id").notNull().references(() => teamDetection.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  weight: integer("weight").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const detectionLogs = pgTable("detection_logs", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  content: text("content").notNull(),
  detectedTeam: text("detected_team"),
  confidence: integer("confidence"),
  matchedKeywords: text("matched_keywords").array(),
  channel: text("channel"),
  contactId: integer("contact_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamDetectionSchema = createInsertSchema(teamDetection).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamDetectionKeywordSchema = createInsertSchema(teamDetectionKeywords).omit({
  id: true,
  createdAt: true,
});

export const insertDetectionLogSchema = createInsertSchema(detectionLogs);

export type TeamDetection = typeof teamDetection.$inferSelect;
export type InsertTeamDetection = z.infer<typeof insertTeamDetectionSchema>;
export type TeamDetectionKeyword = typeof teamDetectionKeywords.$inferSelect;
export type InsertTeamDetectionKeyword = z.infer<typeof insertTeamDetectionKeywordSchema>;
export type DetectionLog = typeof detectionLogs.$inferSelect;
export type InsertDetectionLog = z.infer<typeof insertDetectionLogSchema>;

export const teamDetectionRelations = relations(teamDetection, ({ many }) => ({
  keywords: many(teamDetectionKeywords),
}));

export const teamDetectionKeywordsRelations = relations(teamDetectionKeywords, ({ one }) => ({
  teamDetection: one(teamDetection, {
    fields: [teamDetectionKeywords.teamDetectionId],
    references: [teamDetection.id],
  }),
}));

export type TeamDetectionWithKeywords = TeamDetection & {
  keywords: TeamDetectionKeyword[];
};

// Prof. Ana - AI Assistant Tables
export const aiContext = pgTable("ai_context", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'document', 'faq', 'youtube', 'text'
  content: text("content").notNull(),
  embedding: text("embedding"), // JSON string for vector embeddings
  metadata: jsonb("metadata").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: 'cascade' }),
  messageId: integer("message_id").references(() => messages.id, { onDelete: 'cascade' }),
  classification: text("classification"), // 'lead', 'student', 'complaint', 'spam'
  sentiment: text("sentiment"), // 'positive', 'neutral', 'frustrated'
  confidence: integer("confidence"), // 0-100
  aiMode: text("ai_mode"), // 'mentor', 'consultant'
  aiResponse: text("ai_response"),
  contextUsed: jsonb("context_used").default('[]'),
  handoffReason: text("handoff_reason"),
  handoffTeam: text("handoff_team"),
  sessionData: jsonb("session_data").default('{}'),
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow()
});

export const aiSessions = pgTable("ai_sessions", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: 'cascade' }),
  sessionData: jsonb("session_data").default('{}'),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// AI Memory table for contextual memory per session
export const aiMemory = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => aiSessions.id, { onDelete: 'cascade' }),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: 'cascade' }),
  memoryType: varchar("memory_type", { length: 50 }).notNull(), // 'user_info', 'preferences', 'context', 'history'
  key: varchar("key", { length: 100 }).notNull(), // Chave da memória (ex: 'nome', 'curso_interesse', 'problema_anterior')
  value: text("value").notNull(), // Valor da memória
  confidence: integer("confidence").default(100), // Confiança da informação (0-100)
  source: varchar("source", { length: 50 }).default('ai'), // 'ai', 'user', 'system'
  expiresAt: timestamp("expires_at"), // Opcional: quando a memória expira
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for AI tables
export const insertAiContextSchema = createInsertSchema(aiContext).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiLogSchema = createInsertSchema(aiLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiSessionSchema = createInsertSchema(aiSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAiMemorySchema = createInsertSchema(aiMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for AI tables
export type ProfAnaContext = typeof aiContext.$inferSelect;
export type InsertProfAnaContext = z.infer<typeof insertAiContextSchema>;
export type ProfAnaLog = typeof aiLogs.$inferSelect;
export type InsertProfAnaLog = z.infer<typeof insertAiLogSchema>;
export type ProfAnaSession = typeof aiSessions.$inferSelect;
export type InsertProfAnaSession = z.infer<typeof insertAiSessionSchema>;
export type ProfAnaMemory = typeof aiMemory.$inferSelect;
export type InsertProfAnaMemory = z.infer<typeof insertAiMemorySchema>;

// Relations for AI tables
export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  conversation: one(conversations, {
    fields: [aiLogs.conversationId],
    references: [conversations.id],
  }),
  contact: one(contacts, {
    fields: [aiLogs.contactId],
    references: [contacts.id],
  }),
  message: one(messages, {
    fields: [aiLogs.messageId],
    references: [messages.id],
  }),
}));

export const aiSessionsRelations = relations(aiSessions, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [aiSessions.conversationId],
    references: [conversations.id],
  }),
  contact: one(contacts, {
    fields: [aiSessions.contactId],
    references: [contacts.id],
  }),
  memories: many(aiMemory),
}));

export const aiMemoryRelations = relations(aiMemory, ({ one }) => ({
  session: one(aiSessions, {
    fields: [aiMemory.sessionId],
    references: [aiSessions.id],
  }),
  conversation: one(conversations, {
    fields: [aiMemory.conversationId],
    references: [conversations.id],
  }),
  contact: one(contacts, {
    fields: [aiMemory.contactId],
    references: [contacts.id],
  }),
}));

// Internal Chat Relations
export const internalChatChannelsRelations = relations(internalChatChannels, ({ one, many }) => ({
  team: one(teams, {
    fields: [internalChatChannels.teamId],
    references: [teams.id],
  }),
  creator: one(systemUsers, {
    fields: [internalChatChannels.createdBy],
    references: [systemUsers.id],
  }),
  messages: many(internalChatMessages),
}));

export const internalChatMessagesRelations = relations(internalChatMessages, ({ one }) => ({
  channel: one(internalChatChannels, {
    fields: [internalChatMessages.channelId],
    references: [internalChatChannels.id],
  }),
  user: one(systemUsers, {
    fields: [internalChatMessages.userId],
    references: [systemUsers.id],
  }),
  replyTo: one(internalChatMessages, {
    fields: [internalChatMessages.replyToId],
    references: [internalChatMessages.id],
  }),
}));

// Insert schemas for Internal Chat
export const insertInternalChatChannelSchema = createInsertSchema(internalChatChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInternalChatMessageSchema = createInsertSchema(internalChatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Internal Chat
export type InternalChatChannel = typeof internalChatChannels.$inferSelect;
export type InsertInternalChatChannel = z.infer<typeof insertInternalChatChannelSchema>;
export type InternalChatMessage = typeof internalChatMessages.$inferSelect;
export type InsertInternalChatMessage = z.infer<typeof insertInternalChatMessageSchema>;

// Prof. Ana Configuration Table
export const aiConfig = pgTable("ai_config", {
  id: serial("id").primaryKey(),
  openaiApiKey: text("openai_api_key"),
  perplexityApiKey: text("perplexity_api_key"),
  elevenlabsApiKey: text("elevenlabs_api_key"),
  anthropicApiKey: text("anthropic_api_key"),
  enabledFeatures: jsonb("enabled_features").default({
    webSearch: false,
    voiceSynthesis: false,
    imageAnalysis: false,
    contextualMemory: true
  }),
  responseSettings: jsonb("response_settings").default({
    maxTokens: 1000,
    temperature: 0.7,
    model: "claude-sonnet-4-20250514"
  }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema for AI configuration
export const insertAiConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for AI configuration
export type AIConfig = typeof aiConfig.$inferSelect;
export type InsertAIConfig = z.infer<typeof insertAiConfigSchema>;
