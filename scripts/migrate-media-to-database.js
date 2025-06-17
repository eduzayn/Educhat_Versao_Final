/**
 * Script para migrar arquivos de mídia do sistema de arquivos para o banco de dados
 * Solução robusta para produção
 */

const { db } = require('../server/db');
const { messages, mediaFiles } = require('../shared/schema');
const { eq, and, isNotNull } = require('drizzle-orm');
const fs = require('fs').promises;
const path = require('path');

async function migrateMediaToDatabase() {
  console.log('🚀 Iniciando migração de mídia para o banco de dados...');
  
  try {
    // Buscar mensagens que têm arquivos de mídia no sistema de arquivos
    const messagesWithMedia = await db
      .select()
      .from(messages)
      .where(
        and(
          isNotNull(messages.metadata),
          messages.messageType !== 'text'
        )
      );

    console.log(`📁 Encontradas ${messagesWithMedia.length} mensagens com mídia`);

    let migrated = 0;
    let errors = 0;

    for (const message of messagesWithMedia) {
      try {
        const metadata = message.metadata;
        
        // Verificar se já existe registro na tabela media_files
        const [existingMediaFile] = await db
          .select()
          .from(mediaFiles)
          .where(eq(mediaFiles.messageId, message.id));

        if (existingMediaFile) {
          console.log(`⏭️  Mensagem ${message.id} já migrada`);
          continue;
        }

        // Verificar se tem fileUrl nos metadados
        if (!metadata || !metadata.fileUrl) {
          console.log(`⚠️  Mensagem ${message.id} sem fileUrl nos metadados`);
          continue;
        }

        const filePath = path.join(process.cwd(), metadata.fileUrl);
        
        try {
          // Verificar se arquivo existe
          await fs.access(filePath);
          
          // Ler arquivo
          const fileBuffer = await fs.readFile(filePath);
          const fileBase64 = fileBuffer.toString('base64');
          
          // Extrair informações do arquivo
          const fileName = metadata.fileName || path.basename(filePath);
          const mimeType = metadata.mimeType || 'application/octet-stream';
          const fileSize = metadata.fileSize || fileBuffer.length;
          
          // Determinar tipo de mídia
          let mediaType = 'document';
          if (mimeType.startsWith('image/')) {
            mediaType = 'image';
          } else if (mimeType.startsWith('video/')) {
            mediaType = 'video';
          } else if (mimeType.startsWith('audio/')) {
            mediaType = 'audio';
          }
          
          // Inserir na tabela media_files
          await db.insert(mediaFiles).values({
            messageId: message.id,
            fileName: fileName,
            originalName: fileName,
            mimeType: mimeType,
            fileSize: fileSize,
            fileData: fileBase64,
            mediaType: mediaType,
            isCompressed: false,
            zapiSent: metadata.sentViaZapi || false,
            zapiMessageId: metadata.zaapId || null
          });

          // Atualizar metadata da mensagem para indicar migração
          await db.update(messages)
            .set({
              metadata: {
                ...metadata,
                migratedToDatabase: true,
                migrationDate: new Date().toISOString()
              }
            })
            .where(eq(messages.id, message.id));

          migrated++;
          console.log(`✅ Migrada mensagem ${message.id}: ${fileName}`);
          
        } catch (fileError) {
          console.log(`❌ Erro ao ler arquivo para mensagem ${message.id}: ${fileError.message}`);
          errors++;
        }
        
      } catch (messageError) {
        console.error(`❌ Erro ao processar mensagem ${message.id}:`, messageError);
        errors++;
      }
    }

    console.log('\n📊 Resultado da migração:');
    console.log(`✅ Migradas: ${migrated}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📁 Total processadas: ${messagesWithMedia.length}`);
    
    if (migrated > 0) {
      console.log('\n🎉 Migração concluída! Arquivos agora estão armazenados no banco de dados.');
      console.log('💡 Para produção, você pode usar a rota /api/media/upload-production');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateMediaToDatabase()
    .then(() => {
      console.log('✅ Script de migração concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateMediaToDatabase };