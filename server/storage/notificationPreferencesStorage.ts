import { db } from "../db";
import { notificationPreferences, type NotificationPreferences, type InsertNotificationPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";

export class NotificationPreferencesStorage {
  
  async getUserPreferences(userId: number): Promise<NotificationPreferences | null> {
    try {
      const [preferences] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      return preferences || null;
    } catch (error) {
      console.error("Erro ao buscar preferências de notificação:", error);
      return null;
    }
  }

  async createUserPreferences(data: InsertNotificationPreferences): Promise<NotificationPreferences> {
    try {
      const [newPreferences] = await db
        .insert(notificationPreferences)
        .values(data)
        .returning();
      
      return newPreferences;
    } catch (error) {
      console.error("Erro ao criar preferências de notificação:", error);
      throw error;
    }
  }

  async updateUserPreferences(userId: number, data: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences | null> {
    try {
      const [updatedPreferences] = await db
        .update(notificationPreferences)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      
      return updatedPreferences || null;
    } catch (error) {
      console.error("Erro ao atualizar preferências de notificação:", error);
      return null;
    }
  }

  async upsertUserPreferences(userId: number, data: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences> {
    try {
      // Primeiro, tenta buscar as preferências existentes
      const existing = await this.getUserPreferences(userId);
      
      if (existing) {
        // Se existir, atualiza
        const updated = await this.updateUserPreferences(userId, data);
        if (!updated) {
          throw new Error("Falha ao atualizar preferências");
        }
        return updated;
      } else {
        // Se não existir, cria com valores padrão
        const newData: InsertNotificationPreferences = {
          userId,
          notifyOnNewMessage: true,
          notifyOnNewContact: false,
          notifyOnMention: true,
          notifyWithSound: false,
          notifyOnAssignment: true,
          notifyOnTransfer: true,
          notifyOnTextMessage: true,
          notifyOnAudioMessage: true,
          notifyOnImageMessage: true,
          notifyOnVideoMessage: true,
          notifyOnDocumentMessage: true,
          quietHours: {
            enabled: false,
            start: "22:00",
            end: "08:00"
          },
          maxNotificationsPerHour: 20,
          ...data
        };
        
        return await this.createUserPreferences(newData);
      }
    } catch (error) {
      console.error("Erro ao fazer upsert das preferências:", error);
      throw error;
    }
  }

  async deleteUserPreferences(userId: number): Promise<boolean> {
    try {
      await db
        .delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      return true;
    } catch (error) {
      console.error("Erro ao deletar preferências de notificação:", error);
      return false;
    }
  }

  // Método auxiliar para verificar se o usuário deve receber notificação
  async shouldNotifyUser(userId: number, notificationType: keyof NotificationPreferences): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        // Se não tem preferências, usa valores padrão
        const defaultValues = {
          notifyOnNewMessage: true,
          notifyOnNewContact: false,
          notifyOnMention: true,
          notifyWithSound: false,
          notifyOnAssignment: true,
          notifyOnTransfer: true,
          notifyOnTextMessage: true,
          notifyOnAudioMessage: true,
          notifyOnImageMessage: true,
          notifyOnVideoMessage: true,
          notifyOnDocumentMessage: true,
        };
        
        return defaultValues[notificationType as keyof typeof defaultValues] ?? false;
      }

      // Verifica horário silencioso
      if (preferences.quietHours && typeof preferences.quietHours === 'object') {
        const quietHours = preferences.quietHours as { enabled: boolean; start: string; end: string };
        if (quietHours.enabled) {
          const now = new Date();
          const currentTime = now.getHours() * 100 + now.getMinutes();
          const startTime = parseInt(quietHours.start.replace(':', ''));
          const endTime = parseInt(quietHours.end.replace(':', ''));
          
          if (startTime > endTime) {
            // Atravessa meia-noite (ex: 22:00 a 08:00)
            if (currentTime >= startTime || currentTime <= endTime) {
              return false;
            }
          } else {
            // No mesmo dia (ex: 08:00 a 18:00)
            if (currentTime >= startTime && currentTime <= endTime) {
              return false;
            }
          }
        }
      }

      return Boolean(preferences[notificationType]);
    } catch (error) {
      console.error("Erro ao verificar se deve notificar usuário:", error);
      return false;
    }
  }

  // Método para verificar múltiplos tipos de notificação
  async shouldNotifyUserForMessageType(userId: number, messageType: string): Promise<boolean> {
    const typeMap: Record<string, keyof NotificationPreferences> = {
      'text': 'notifyOnTextMessage',
      'audio': 'notifyOnAudioMessage',
      'image': 'notifyOnImageMessage',
      'video': 'notifyOnVideoMessage',
      'document': 'notifyOnDocumentMessage',
      'file': 'notifyOnDocumentMessage',
    };

    const notificationKey = typeMap[messageType] || 'notifyOnNewMessage';
    return await this.shouldNotifyUser(userId, notificationKey);
  }
}

export const notificationPreferencesStorage = new NotificationPreferencesStorage();