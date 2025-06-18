/**
 * Script para corrigir handoffs pendentes e executar atribuições
 */

import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
import { handoffs, conversations } from '../shared/schema.js';

async function fixPendingHandoffs() {
  console.log('🔍 Iniciando correção de handoffs pendentes...');
  
  try {
    // Buscar todos os handoffs pendentes
    const pendingHandoffs = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.status, 'pending'))
      .orderBy(handoffs.createdAt);

    console.log(`📋 Encontrados ${pendingHandoffs.length} handoffs pendentes`);

    for (const handoff of pendingHandoffs) {
      console.log(`\n🔄 Processando handoff ID ${handoff.id} - Conversa ${handoff.conversationId}`);
      
      try {
        // Dados para atualizar a conversa
        const updateData = {
          updatedAt: new Date(),
          priority: handoff.priority || 'normal'
        };

        // Atribuir equipe se especificada
        if (handoff.toTeamId) {
          updateData.assignedTeamId = handoff.toTeamId;
          console.log(`   → Atribuindo à equipe ${handoff.toTeamId}`);
        }

        // Atribuir usuário se especificado
        if (handoff.toUserId) {
          updateData.assignedUserId = handoff.toUserId;
          updateData.assignedAt = new Date();
          console.log(`   → Atribuindo ao usuário ${handoff.toUserId}`);
        }

        // Atualizar conversa
        await db
          .update(conversations)
          .set(updateData)
          .where(eq(conversations.id, handoff.conversationId));

        // Marcar handoff como completado
        await db
          .update(handoffs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(handoffs.id, handoff.id));

        console.log(`   ✅ Handoff ${handoff.id} completado com sucesso`);

      } catch (error) {
        console.error(`   ❌ Erro ao processar handoff ${handoff.id}:`, error.message);
      }
    }

    // Verificar resultado
    const remainingPending = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.status, 'pending'));

    console.log(`\n📊 Resultado:`);
    console.log(`   - Handoffs processados: ${pendingHandoffs.length}`);
    console.log(`   - Handoffs ainda pendentes: ${remainingPending.length}`);

    if (remainingPending.length === 0) {
      console.log(`🎉 Todos os handoffs pendentes foram processados com sucesso!`);
    }

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPendingHandoffs()
    .then(() => {
      console.log('✅ Script de correção finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { fixPendingHandoffs };