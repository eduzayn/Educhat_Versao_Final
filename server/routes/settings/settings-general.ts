import { Express, Response } from 'express';
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { systemSettings, insertSystemSettingSchema } from '@shared/schema';

export function registerGeneralSettingsRoutes(app: Express) {
  // Get system settings by category
  app.get('/api/settings/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, category));
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update system setting
  app.post('/api/settings/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const validatedData = insertSystemSettingSchema.parse({
        ...req.body,
        category
      });

      // Check if setting exists
      const [existingSetting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, validatedData.key))
        .limit(1);

      let setting;
      if (existingSetting) {
        // Update existing setting
        [setting] = await db
          .update(systemSettings)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(systemSettings.id, existingSetting.id))
          .returning();
      } else {
        // Create new setting
        [setting] = await db
          .insert(systemSettings)
          .values(validatedData)
          .returning();
      }

      res.json(setting);
    } catch (error) {
      console.error('Erro ao salvar configuração do sistema:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });
} 