import type { Express } from "express";
import { Router } from 'express';
import { storage } from "../../storage/index";
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { aiConfig, insertAiConfigSchema, systemSettings, insertSystemSettingSchema } from '../../../shared/schema';
import { insertManychatIntegrationSchema } from "../../../shared/schema";
import { facebookRoutes } from '../integrations/facebook';
import Anthropic from '@anthropic-ai/sdk';
import { registerIntegrationsRoutes } from './settings-integrations';
import { registerAIRoutes } from './settings-ai';
import { registerGeneralSettingsRoutes } from './settings-general';

const router = Router();

// Schema para teste de conexão Manychat
const manychatTestSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória")
});

export function registerSettingsRoutes(app: Express) {
  registerIntegrationsRoutes(app);
  registerAIRoutes(app);
  registerGeneralSettingsRoutes(app);
}