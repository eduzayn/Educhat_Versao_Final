import express from "express";
import { z } from "zod";
import { notificationPreferencesStorage } from "../../storage/notificationPreferencesStorage";
import { insertNotificationPreferencesSchema } from "@shared/schema";

const router = express.Router();

// GET /api/notification-preferences - Buscar preferências do usuário logado
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const preferences = await notificationPreferencesStorage.getUserPreferences(userId);
    
    if (!preferences) {
      // Se não existir, retorna valores padrão
      const defaultPreferences = {
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
        maxNotificationsPerHour: 20
      };
      
      return res.json(defaultPreferences);
    }

    res.json(preferences);
  } catch (error) {
    console.error("Erro ao buscar preferências de notificação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/notification-preferences - Atualizar preferências do usuário logado
router.put("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Validação dos dados
    const updateSchema = insertNotificationPreferencesSchema.partial().omit({ userId: true });
    const validatedData = updateSchema.parse(req.body);

    const updatedPreferences = await notificationPreferencesStorage.upsertUserPreferences(userId, validatedData);
    
    res.json(updatedPreferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }
    
    console.error("Erro ao atualizar preferências de notificação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PATCH /api/notification-preferences/toggle/:setting - Toggle específico de uma configuração
router.patch("/toggle/:setting", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { setting } = req.params;
    
    // Lista de configurações permitidas para toggle
    const allowedSettings = [
      'notifyOnNewMessage',
      'notifyOnNewContact', 
      'notifyOnMention',
      'notifyWithSound',
      'notifyOnAssignment',
      'notifyOnTransfer',
      'notifyOnTextMessage',
      'notifyOnAudioMessage',
      'notifyOnImageMessage',
      'notifyOnVideoMessage',
      'notifyOnDocumentMessage'
    ];

    if (!allowedSettings.includes(setting)) {
      return res.status(400).json({ error: "Configuração inválida" });
    }

    // Busca preferências atuais
    const currentPreferences = await notificationPreferencesStorage.getUserPreferences(userId);
    
    // Determina o valor atual (ou padrão se não existir)
    const currentValue = currentPreferences?.[setting as keyof typeof currentPreferences] ?? true;
    
    // Inverte o valor
    const newValue = !currentValue;
    
    // Atualiza
    const updatedPreferences = await notificationPreferencesStorage.upsertUserPreferences(userId, {
      [setting]: newValue
    });
    
    res.json({ 
      setting, 
      oldValue: currentValue, 
      newValue,
      preferences: updatedPreferences 
    });
  } catch (error) {
    console.error("Erro ao fazer toggle da configuração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/notification-preferences/check/:type - Verificar se deve notificar para um tipo específico
router.get("/check/:type", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { type } = req.params;
    const { messageType } = req.query;

    let shouldNotify: boolean;
    
    if (messageType && typeof messageType === 'string') {
      // Verificação por tipo de mensagem
      shouldNotify = await notificationPreferencesStorage.shouldNotifyUserForMessageType(userId, messageType);
    } else {
      // Verificação por tipo de notificação
      shouldNotify = await notificationPreferencesStorage.shouldNotifyUser(userId, type as any);
    }
    
    res.json({ shouldNotify, type, messageType });
  } catch (error) {
    console.error("Erro ao verificar se deve notificar:", error);
    res.status(500).json({ error: "Erro interno do servidor", shouldNotify: false });
  }
});

// POST /api/notification-preferences/reset - Resetar para valores padrão
router.post("/reset", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const defaultData = {
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
      maxNotificationsPerHour: 20
    };

    const resetPreferences = await notificationPreferencesStorage.upsertUserPreferences(userId, defaultData);
    
    res.json(resetPreferences);
  } catch (error) {
    console.error("Erro ao resetar preferências:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;