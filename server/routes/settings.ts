import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

interface SecretConfig {
  OPENAI_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
}

interface SecretStatus {
  name: string;
  isConfigured: boolean;
  isWorking: boolean;
  lastTested?: string;
}

// Caminho para o arquivo de configurações (em produção seria um sistema mais seguro)
const configPath = path.join(process.cwd(), '.env.local');

// Função para ler configurações atuais
async function readConfig(): Promise<SecretConfig> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config: SecretConfig = {};
    
    content.split('\n').forEach(line => {
      if (line.includes('OPENAI_API_KEY=')) {
        config.OPENAI_API_KEY = line.split('=')[1]?.replace(/"/g, '');
      }
      if (line.includes('PERPLEXITY_API_KEY=')) {
        config.PERPLEXITY_API_KEY = line.split('=')[1]?.replace(/"/g, '');
      }
    });
    
    return config;
  } catch (error) {
    return {};
  }
}

// Função para escrever configurações
async function writeConfig(config: SecretConfig): Promise<void> {
  try {
    let content = '';
    
    // Ler arquivo existente
    try {
      content = await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      // Arquivo não existe, começar do zero
      content = '';
    }
    
    // Atualizar ou adicionar configurações
    const lines = content.split('\n');
    const updatedLines: string[] = [];
    let openaiUpdated = false;
    let perplexityUpdated = false;
    
    lines.forEach(line => {
      if (line.includes('OPENAI_API_KEY=')) {
        if (config.OPENAI_API_KEY) {
          updatedLines.push(`OPENAI_API_KEY="${config.OPENAI_API_KEY}"`);
          openaiUpdated = true;
        }
      } else if (line.includes('PERPLEXITY_API_KEY=')) {
        if (config.PERPLEXITY_API_KEY) {
          updatedLines.push(`PERPLEXITY_API_KEY="${config.PERPLEXITY_API_KEY}"`);
          perplexityUpdated = true;
        }
      } else if (line.trim()) {
        updatedLines.push(line);
      }
    });
    
    // Adicionar novas configurações se não existiam
    if (!openaiUpdated && config.OPENAI_API_KEY) {
      updatedLines.push(`OPENAI_API_KEY="${config.OPENAI_API_KEY}"`);
    }
    if (!perplexityUpdated && config.PERPLEXITY_API_KEY) {
      updatedLines.push(`PERPLEXITY_API_KEY="${config.PERPLEXITY_API_KEY}"`);
    }
    
    await fs.writeFile(configPath, updatedLines.join('\n') + '\n');
    
    // Atualizar variáveis de ambiente em tempo real
    if (config.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = config.OPENAI_API_KEY;
    }
    if (config.PERPLEXITY_API_KEY) {
      process.env.PERPLEXITY_API_KEY = config.PERPLEXITY_API_KEY;
    }
    
  } catch (error) {
    throw new Error('Erro ao salvar configurações');
  }
}

// Função para testar uma API key do OpenAI
async function testOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Função para testar uma API key do Perplexity
async function testPerplexity(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    return response.ok || response.status === 400; // 400 pode indicar que a key é válida mas o request tem problema
  } catch (error) {
    return false;
  }
}

// GET /api/settings/secrets/status - Verificar status das secrets
router.get('/secrets/status', async (req: Request, res: Response) => {
  try {
    const config = await readConfig();
    const statuses: SecretStatus[] = [];
    
    // Status do OpenAI
    const openaiStatus: SecretStatus = {
      name: 'OpenAI',
      isConfigured: !!config.OPENAI_API_KEY || !!process.env.OPENAI_API_KEY,
      isWorking: false,
    };
    
    if (openaiStatus.isConfigured) {
      const apiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      openaiStatus.isWorking = await testOpenAI(apiKey!);
    }
    
    statuses.push(openaiStatus);
    
    // Status do Perplexity
    const perplexityStatus: SecretStatus = {
      name: 'Perplexity',
      isConfigured: !!config.PERPLEXITY_API_KEY || !!process.env.PERPLEXITY_API_KEY,
      isWorking: false,
    };
    
    if (perplexityStatus.isConfigured) {
      const apiKey = config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
      perplexityStatus.isWorking = await testPerplexity(apiKey!);
    }
    
    statuses.push(perplexityStatus);
    
    res.json(statuses);
  } catch (error) {
    console.error('❌ Erro ao verificar status das secrets:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/settings/secrets - Salvar secrets
router.post('/secrets', async (req: Request, res: Response) => {
  try {
    const { openaiKey, perplexityKey } = req.body;
    
    if (!openaiKey) {
      return res.status(400).json({ error: 'OpenAI API Key é obrigatória' });
    }
    
    const config: SecretConfig = {
      OPENAI_API_KEY: openaiKey,
    };
    
    if (perplexityKey) {
      config.PERPLEXITY_API_KEY = perplexityKey;
    }
    
    await writeConfig(config);
    
    console.log('✅ Configurações de IA atualizadas com sucesso');
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// POST /api/settings/secrets/test - Testar todas as secrets
router.post('/secrets/test', async (req: Request, res: Response) => {
  try {
    const config = await readConfig();
    let total = 0;
    let working = 0;
    
    // Testar OpenAI
    if (config.OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
      total++;
      const apiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (await testOpenAI(apiKey!)) {
        working++;
      }
    }
    
    // Testar Perplexity
    if (config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY) {
      total++;
      const apiKey = config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
      if (await testPerplexity(apiKey!)) {
        working++;
      }
    }
    
    console.log(`🧪 Teste de APIs concluído: ${working}/${total} funcionando`);
    res.json({ total, working, message: `${working} de ${total} APIs funcionando` });
  } catch (error) {
    console.error('❌ Erro ao testar configurações:', error);
    res.status(500).json({ error: 'Erro ao testar configurações' });
  }
});

export default router;