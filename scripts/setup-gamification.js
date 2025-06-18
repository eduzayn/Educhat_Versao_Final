/**
 * Script para configurar badges e dados iniciais do sistema de gamificação
 */

import { db } from '../server/db.js';
import { gamificationBadges } from '../shared/schema.js';

async function setupGamificationBadges() {
  console.log('🎮 Configurando badges do sistema de gamificação...');
  
  try {
    const badges = [
      // Badges de Conversas
      {
        name: 'Primeiro Contato',
        description: 'Atendeu sua primeira conversa',
        icon: 'MessageCircle',
        color: '#10B981',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 1,
          period: 'all_time'
        },
        points: 50,
        rarity: 'common'
      },
      {
        name: 'Conversador',
        description: 'Atendeu 10 conversas',
        icon: 'Users',
        color: '#3B82F6',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 10,
          period: 'all_time'
        },
        points: 100,
        rarity: 'common'
      },
      {
        name: 'Expert em Atendimento',
        description: 'Atendeu 50 conversas',
        icon: 'Award',
        color: '#8B5CF6',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 50,
          period: 'all_time'
        },
        points: 250,
        rarity: 'rare'
      },
      {
        name: 'Mestre da Comunicação',
        description: 'Atendeu 100 conversas',
        icon: 'Crown',
        color: '#F59E0B',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 100,
          period: 'all_time'
        },
        points: 500,
        rarity: 'epic'
      },
      {
        name: 'Lenda do Atendimento',
        description: 'Atendeu 250 conversas',
        icon: 'Star',
        color: '#EF4444',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 250,
          period: 'all_time'
        },
        points: 1000,
        rarity: 'legendary'
      },

      // Badges de Resolução
      {
        name: 'Solucionador',
        description: 'Resolveu sua primeira conversa',
        icon: 'CheckCircle',
        color: '#10B981',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_closed',
          value: 1,
          period: 'all_time'
        },
        points: 75,
        rarity: 'common'
      },
      {
        name: 'Resolvedor Eficiente',
        description: 'Resolveu 25 conversas',
        icon: 'Target',
        color: '#3B82F6',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_closed',
          value: 25,
          period: 'all_time'
        },
        points: 200,
        rarity: 'rare'
      },
      {
        name: 'Mestre dos Resultados',
        description: 'Resolveu 100 conversas',
        icon: 'Trophy',
        color: '#F59E0B',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_closed',
          value: 100,
          period: 'all_time'
        },
        points: 750,
        rarity: 'epic'
      },

      // Badges Diários
      {
        name: 'Produtivo do Dia',
        description: 'Atendeu 5 conversas em um dia',
        icon: 'Calendar',
        color: '#06B6D4',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 5,
          period: 'daily'
        },
        points: 100,
        rarity: 'common'
      },
      {
        name: 'Super Produtivo',
        description: 'Atendeu 10 conversas em um dia',
        icon: 'Zap',
        color: '#8B5CF6',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 10,
          period: 'daily'
        },
        points: 200,
        rarity: 'rare'
      },

      // Badges Semanais
      {
        name: 'Consistente',
        description: 'Atendeu 25 conversas em uma semana',
        icon: 'TrendingUp',
        color: '#10B981',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 25,
          period: 'weekly'
        },
        points: 300,
        rarity: 'rare'
      },
      {
        name: 'Dedicado',
        description: 'Atendeu 50 conversas em uma semana',
        icon: 'Heart',
        color: '#EF4444',
        category: 'conversas',
        condition: {
          type: 'count',
          metric: 'conversations_assigned',
          value: 50,
          period: 'weekly'
        },
        points: 500,
        rarity: 'epic'
      }
    ];

    // Inserir badges no banco
    for (const badge of badges) {
      try {
        await db.insert(gamificationBadges).values(badge);
        console.log(`   ✅ Badge criado: ${badge.name}`);
      } catch (error) {
        if (error.message?.includes('unique')) {
          console.log(`   ⚠️ Badge já existe: ${badge.name}`);
        } else {
          console.error(`   ❌ Erro ao criar badge ${badge.name}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Sistema de gamificação configurado com ${badges.length} badges!`);
    console.log('📊 Categorias disponíveis: conversas');
    console.log('🏆 Níveis de raridade: common, rare, epic, legendary');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGamificationBadges().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

export { setupGamificationBadges };