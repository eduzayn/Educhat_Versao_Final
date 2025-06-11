CREATE TABLE "ai_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "openai_api_key" text,
        "perplexity_api_key" text,
        "elevenlabs_api_key" text,
        "anthropic_api_key" text,
        "enabled_features" jsonb DEFAULT '{"webSearch":false,"voiceSynthesis":false,"imageAnalysis":false,"contextualMemory":true}'::jsonb,
        "response_settings" jsonb DEFAULT '{"maxTokens":1000,"temperature":0.7,"model":"claude-sonnet-4-20250514"}'::jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_context" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "content" text NOT NULL,
        "embedding" text,
        "metadata" jsonb DEFAULT '{}',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer,
        "contact_id" integer,
        "message_id" integer,
        "classification" text,
        "sentiment" text,
        "confidence" integer,
        "ai_mode" text,
        "ai_response" text,
        "context_used" jsonb DEFAULT '[]',
        "handoff_reason" text,
        "handoff_team" text,
        "session_data" jsonb DEFAULT '{}',
        "processing_time" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_memory" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer,
        "conversation_id" integer,
        "contact_id" integer,
        "memory_type" varchar(50) NOT NULL,
        "key" varchar(100) NOT NULL,
        "value" text NOT NULL,
        "confidence" integer DEFAULT 100,
        "source" varchar(50) DEFAULT 'ai',
        "expires_at" timestamp,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer,
        "contact_id" integer,
        "session_data" jsonb DEFAULT '{}',
        "last_interaction" timestamp DEFAULT now(),
        "is_active" boolean DEFAULT true,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "action" varchar(100) NOT NULL,
        "resource" varchar(50) NOT NULL,
        "resource_id" varchar(50),
        "channel" varchar(50),
        "team_type" varchar(20),
        "data_key" varchar(200),
        "details" jsonb,
        "ip_address" varchar(45),
        "user_agent" text,
        "result" varchar(20) DEFAULT 'success',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channels" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "type" varchar(50) NOT NULL,
        "identifier" varchar(100),
        "description" text,
        "instance_id" varchar(100),
        "token" varchar(255),
        "client_token" varchar(255),
        "configuration" jsonb,
        "is_active" boolean DEFAULT true,
        "is_connected" boolean DEFAULT false,
        "last_connection_check" timestamp,
        "connection_status" varchar(50) DEFAULT 'disconnected',
        "webhook_url" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_notes" (
        "id" serial PRIMARY KEY NOT NULL,
        "contact_id" integer NOT NULL,
        "content" text NOT NULL,
        "author_name" varchar(100) NOT NULL,
        "author_id" varchar,
        "is_private" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_tags" (
        "id" serial PRIMARY KEY NOT NULL,
        "contact_id" integer NOT NULL,
        "tag" varchar(50) NOT NULL,
        "color" varchar(20) DEFAULT 'blue',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "phone" text,
        "email" text,
        "profile_image_url" text,
        "location" text,
        "age" integer,
        "is_online" boolean DEFAULT false,
        "last_seen_at" timestamp,
        "canal_origem" varchar(50),
        "nome_canal" varchar(100),
        "id_canal" varchar(50),
        "user_identity" varchar(100),
        "assigned_user_id" integer,
        "tags" text[],
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "contact_id" integer NOT NULL,
        "channel" varchar(50) NOT NULL,
        "channel_id" integer,
        "status" varchar(20) DEFAULT 'open',
        "last_message_at" timestamp DEFAULT now(),
        "unread_count" integer DEFAULT 0,
        "team_type" varchar(20),
        "assigned_team_id" integer,
        "assigned_user_id" integer,
        "assignment_method" varchar(20) DEFAULT 'automatic',
        "assigned_at" timestamp,
        "is_read" boolean DEFAULT false,
        "priority" varchar(20) DEFAULT 'normal',
        "tags" text[],
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_rules" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "user_id" integer,
        "role_id" integer,
        "permission_id" integer NOT NULL,
        "conditions" jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "contact_id" integer NOT NULL,
        "team_type" varchar(20) DEFAULT 'comercial' NOT NULL,
        "stage" varchar(50) DEFAULT 'prospecting' NOT NULL,
        "value" integer DEFAULT 0,
        "probability" integer DEFAULT 0,
        "expected_close_date" timestamp,
        "actual_close_date" timestamp,
        "owner" varchar(100),
        "assigned_user_id" integer,
        "created_by_user_id" integer,
        "canal_origem" varchar(50),
        "category" varchar(100),
        "course" varchar(200),
        "tags" jsonb DEFAULT '[]'::jsonb,
        "notes" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "detection_logs" (
        "id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "detection_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "content" text NOT NULL,
        "detected_team" text,
        "confidence" integer,
        "matched_keywords" text[],
        "channel" text,
        "contact_id" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facebook_integrations" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "app_id" text NOT NULL,
        "app_secret" text NOT NULL,
        "access_token" text,
        "page_id" text,
        "page_name" text,
        "instagram_account_id" text,
        "instagram_username" text,
        "webhook_verify_token" text NOT NULL,
        "is_active" boolean DEFAULT false,
        "messenger_enabled" boolean DEFAULT true,
        "instagram_enabled" boolean DEFAULT true,
        "comments_enabled" boolean DEFAULT true,
        "token_expires_at" timestamp,
        "last_sync" timestamp,
        "configuration" jsonb DEFAULT '{}',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facebook_webhook_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "integration_id" integer,
        "webhook_type" text NOT NULL,
        "platform" text NOT NULL,
        "sender_id" text,
        "recipient_id" text,
        "message_id" text,
        "conversation_id" text,
        "content" text,
        "message_type" text,
        "attachments" jsonb DEFAULT '[]',
        "processed" boolean DEFAULT false,
        "contact_id" integer,
        "conversation_contact_id" integer,
        "raw_data" jsonb NOT NULL,
        "error" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_detection" (
        "id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "team_detection_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "name" text NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "priority" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_detection_keywords" (
        "id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "team_detection_keywords_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
        "team_detection_id" integer NOT NULL,
        "keyword" text NOT NULL,
        "weight" integer DEFAULT 1 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manychat_integrations" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "api_key" varchar(255) NOT NULL,
        "webhook_url" text,
        "is_active" boolean DEFAULT false,
        "sync_enabled" boolean DEFAULT true,
        "lead_sync_enabled" boolean DEFAULT true,
        "enrollment_sync_enabled" boolean DEFAULT true,
        "notification_sync_enabled" boolean DEFAULT false,
        "configuration" jsonb DEFAULT '{}',
        "last_test_at" timestamp,
        "last_sync_at" timestamp,
        "error_count" integer DEFAULT 0,
        "last_error" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manychat_webhook_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "integration_id" integer,
        "webhook_type" varchar(50),
        "payload" jsonb NOT NULL,
        "processed" boolean DEFAULT false,
        "processed_at" timestamp,
        "error" text,
        "contact_id" integer,
        "conversation_id" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "content" text NOT NULL,
        "is_from_contact" boolean NOT NULL,
        "message_type" varchar(20) DEFAULT 'text',
        "metadata" jsonb,
        "is_deleted" boolean DEFAULT false,
        "sent_at" timestamp DEFAULT now(),
        "delivered_at" timestamp,
        "read_at" timestamp,
        "whatsapp_message_id" varchar(50),
        "zapi_status" varchar(20),
        "is_group" boolean DEFAULT false,
        "reference_message_id" varchar(50),
        "is_internal_note" boolean DEFAULT false,
        "author_id" integer,
        "author_name" varchar(100),
        "is_hidden_for_user" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "permissions" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "resource" varchar(50) NOT NULL,
        "action" varchar(50) NOT NULL,
        "description" text,
        "category" varchar(50) DEFAULT 'general',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "quick_replies" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "type" varchar(20) NOT NULL,
        "content" text,
        "additional_text" text,
        "file_url" text,
        "file_name" text,
        "file_size" integer,
        "mime_type" text,
        "shortcut" text,
        "category" text DEFAULT 'general',
        "is_active" boolean DEFAULT true,
        "usage_count" integer DEFAULT 0,
        "created_by" varchar,
        "team_id" integer,
        "is_shared" boolean DEFAULT false,
        "share_scope" varchar(20) DEFAULT 'private',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quick_reply_shares" (
        "id" serial PRIMARY KEY NOT NULL,
        "quick_reply_id" integer NOT NULL,
        "user_id" varchar NOT NULL,
        "shared_by" varchar NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quick_reply_team_shares" (
        "id" serial PRIMARY KEY NOT NULL,
        "quick_reply_id" integer NOT NULL,
        "team_id" integer NOT NULL,
        "shared_by" varchar NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
        "id" serial PRIMARY KEY NOT NULL,
        "role_id" integer NOT NULL,
        "permission_id" integer NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(50) NOT NULL,
        "display_name" varchar(100) NOT NULL,
        "permissions" jsonb DEFAULT '[]',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" varchar(100) NOT NULL,
        "value" text NOT NULL,
        "type" varchar(20) DEFAULT 'string',
        "description" text,
        "category" varchar(50) DEFAULT 'general',
        "is_enabled" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "system_users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(50) NOT NULL,
        "display_name" text NOT NULL,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "role_id" integer,
        "role" varchar(50) NOT NULL,
        "team_id" integer,
        "team" varchar(100),
        "data_key" varchar(200),
        "channels" jsonb DEFAULT '[]'::jsonb,
        "teams" jsonb DEFAULT '[]'::jsonb,
        "is_active" boolean DEFAULT true,
        "is_online" boolean DEFAULT false,
        "status" varchar(20) DEFAULT 'active',
        "last_login_at" timestamp,
        "last_activity_at" timestamp,
        "avatar" text,
        "initials" varchar(5),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "system_users_username_unique" UNIQUE("username"),
        CONSTRAINT "system_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "color" varchar(20) DEFAULT 'blue',
        "team_type" varchar(20) NOT NULL,
        "is_active" boolean DEFAULT true,
        "max_capacity" integer DEFAULT 100,
        "priority" integer DEFAULT 1,
        "working_hours" jsonb,
        "auto_assignment" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "teams_name_unique" UNIQUE("name"),
        CONSTRAINT "teams_team_type_unique" UNIQUE("team_type")
);
--> statement-breakpoint
CREATE TABLE "user_teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "team_id" integer NOT NULL,
        "role" varchar(50) DEFAULT 'agent',
        "is_active" boolean DEFAULT true,
        "joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar NOT NULL,
        "password" varchar NOT NULL,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "profile_image_url" varchar,
        "role" varchar(20) DEFAULT 'user',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_session_id_ai_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assigned_user_id_system_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_team_id_teams_id_fk" FOREIGN KEY ("assigned_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_user_id_system_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_rules" ADD CONSTRAINT "custom_rules_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_user_id_system_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_user_id_system_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facebook_webhook_logs" ADD CONSTRAINT "facebook_webhook_logs_integration_id_facebook_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."facebook_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_detection_keywords" ADD CONSTRAINT "team_detection_keywords_team_detection_id_team_detection_id_fk" FOREIGN KEY ("team_detection_id") REFERENCES "public"."team_detection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manychat_webhook_logs" ADD CONSTRAINT "manychat_webhook_logs_integration_id_manychat_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."manychat_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manychat_webhook_logs" ADD CONSTRAINT "manychat_webhook_logs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manychat_webhook_logs" ADD CONSTRAINT "manychat_webhook_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_system_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_replies" ADD CONSTRAINT "quick_replies_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_shares" ADD CONSTRAINT "quick_reply_shares_quick_reply_id_quick_replies_id_fk" FOREIGN KEY ("quick_reply_id") REFERENCES "public"."quick_replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_shares" ADD CONSTRAINT "quick_reply_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_shares" ADD CONSTRAINT "quick_reply_shares_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_team_shares" ADD CONSTRAINT "quick_reply_team_shares_quick_reply_id_quick_replies_id_fk" FOREIGN KEY ("quick_reply_id") REFERENCES "public"."quick_replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_team_shares" ADD CONSTRAINT "quick_reply_team_shares_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_reply_team_shares" ADD CONSTRAINT "quick_reply_team_shares_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_users" ADD CONSTRAINT "system_users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_system_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");