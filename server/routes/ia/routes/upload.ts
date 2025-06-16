import { Router } from 'express';
import { db } from '../../../db';
import { aiContext } from '../../../../shared/schema';
import fs from 'fs/promises';
import { upload } from '../config';
import { IAContext, UploadTrainingResponse } from '../types';

const router = Router();

/**
 * POST /api/ia/upload-training - Upload de arquivo de treinamento
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Processar o conteúdo do arquivo e adicionar como contextos
    const lines = fileContent.split('\n').filter(line => line.trim());
    const contextsAdded: IAContext[] = [];
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [title, content] = line.split(':').map(s => s.trim());
        if (title && content) {
          const [context] = await db
            .insert(aiContext)
            .values({
              name: title,
              type: 'upload',
              content,
              isActive: true
            })
            .returning();
          
          contextsAdded.push({
            ...context,
            isActive: context.isActive ?? true
          } as IAContext);
        }
      }
    }
    
    // Limpar arquivo temporário
    await fs.unlink(filePath);
    
    const response: UploadTrainingResponse = {
      success: true,
      message: `${contextsAdded.length} contextos adicionados com sucesso`,
      contexts: contextsAdded
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Erro no upload de treinamento:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router; 