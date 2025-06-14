import type { Express } from "express";
import { z } from 'zod';

const analyzeLinkSchema = z.object({
  url: z.string().url('URL inválida')
});

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations?: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function registerLinksRoutes(app: Express) {
  // Analisar conteúdo de link usando Perplexity AI
  app.post('/api/links/analyze', async (req, res) => {
    try {
      const { url } = analyzeLinkSchema.parse(req.body);
      
      // Verificar se a API key está disponível
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({
          error: 'API key da Perplexity não configurada'
        });
      }

      // Fazer requisição para a API Perplexity
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em resumir e analisar conteúdo de links. Forneça um resumo claro, conciso e informativo do conteúdo principal do site ou página web fornecida. Mantenha o resumo entre 2-4 frases e foque nos pontos mais importantes.'
            },
            {
              role: 'user',
              content: `Analise e resuma o conteúdo principal desta URL: ${url}`
            }
          ],
          max_tokens: 300,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API Perplexity:', response.status, errorText);
        throw new Error(`Erro da API Perplexity: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      
      // Extrair o conteúdo da resposta
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Tentar extrair título do URL
      let title: string | undefined;
      try {
        const urlObj = new URL(url);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {
        // Ignorar erro de parsing do URL
      }

      res.json({
        title,
        summary: content,
        citations: data.citations || [],
        url: url
      });

    } catch (error) {
      console.error('Erro ao analisar link:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Falha ao analisar o conteúdo do link',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
}