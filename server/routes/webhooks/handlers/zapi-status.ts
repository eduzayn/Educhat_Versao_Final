import type { Request, Response } from "express";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../../utils/zapi";

/**
 * Obtém status da conexão Z-API
 */
export async function handleGetStatus(req: Request, res: Response) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'status');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
} 