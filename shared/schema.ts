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
  type: varchar("type", { length: 20 }).notNull(), // 'text', 'audio', 'image', 'video'
  content: text("content"), // text content or file URL
  fileUrl: text("file_url"), // for media files
  fileName: text("file_name"), // original filename
  fileSize: integer("file_size"), // file size in bytes
  mimeType: text("mime_type"), // MIME type for media files
  shortcut: text("shortcut"), // keyboard shortcut (e.g., "/hello")
  category: text("category").default("general"), // category for organization
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0), // track usage for analytics
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("blue"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  lastLoginAt: timestamp("last_login_at"),
  avatar: text("avatar"),
  initials: varchar("initials", { length: 5 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const contactsRelations = relations(contacts, ({ many }) => ({
  conversations: many(conversations),
  tags: many(contactTags),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [conversations.contactId],
    references: [contacts.id],
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

export const insertQuickReplySchema = createInsertSchema(quickReplies).omit({
  id: true,
  usageCount: true,
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

// Types
export type User = typeof users.$inferSelect;
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

// Extended types for API responses
export type ConversationWithContact = Conversation & {
  contact: Contact;
  messages: Message[];
  _count?: {
    messages: number;
  };
};

export type ContactWithTags = Contact & {
  tags: ContactTag[];
};

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;

export type QuickReplyWithCreator = QuickReply & {
  creator?: User;
};
