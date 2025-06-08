// Nova implementação do storage usando a estrutura modular refatorada
import { DatabaseStorage as ModularDatabaseStorage } from "../storage/DatabaseStorage";
import type { IStorage as ModularIStorage } from "../storage/interfaces/IStorage";

// Re-export dos tipos para manter compatibilidade
export type {
  User,
  UpsertUser,
  Contact,
  InsertContact,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  ContactTag,
  InsertContactTag,
  QuickReply,
  InsertQuickReply,
  QuickReplyTeamShare,
  InsertQuickReplyTeamShare,
  QuickReplyShare,
  InsertQuickReplyShare,
  SystemUser,
  InsertSystemUser,
  Team,
  InsertTeam,
  Role,
  InsertRole,
  Channel,
  InsertChannel,
  ContactNote,
  InsertContactNote,
  Deal,
  InsertDeal,
  UserTeam,
  InsertUserTeam,
  ConversationWithContact,
  ContactWithTags,
  QuickReplyWithCreator,
  SystemSetting,
  InsertSystemSetting,
} from "../../shared/schema";

// Interface para manter compatibilidade com código existente
export interface IStorage extends ModularIStorage {}

// Classe principal que agora usa a estrutura modular
export class DatabaseStorage extends ModularDatabaseStorage {
  constructor() {
    super();
    console.log("🔄 Storage inicializado com nova estrutura modular");
  }
}

// Instância singleton para manter compatibilidade
export const storage = new DatabaseStorage();