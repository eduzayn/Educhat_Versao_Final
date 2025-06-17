/**
 * Script para configurar contextos específicos do Copilot da Prof. Ana
 * Adiciona base de conhecimento interna para consultas dos colaboradores
 */

import { db } from '../server/db.ts';
import { aiContext } from '../shared/schema.ts';

const copilotContexts = [
  {
    name: 'Cursos de Pós-Graduação - Informações Gerais',
    type: 'copilot_courses',
    content: `CURSOS DE PÓS-GRADUAÇÃO OFERECIDOS:

1. NEUROPSICOPEDAGOGIA
- Duração: 18 meses
- Modalidade: EAD com encontros presenciais opcionais
- Investimento: R$ 149,90/mês (18x) ou R$ 2.399,00 à vista (desconto de 20%)
- Público-alvo: Pedagogos, psicólogos, fonoaudiólogos
- Certificação: Reconhecida pelo MEC

2. PSICOPEDAGOGIA CLÍNICA E INSTITUCIONAL
- Duração: 15 meses
- Modalidade: EAD
- Investimento: R$ 139,90/mês (15x)
- Público-alvo: Educadores, psicólogos
- Diferencial: Estágio supervisionado incluso

3. EDUCAÇÃO ESPECIAL E INCLUSIVA
- Duração: 12 meses
- Modalidade: EAD
- Investimento: R$ 129,90/mês (12x)
- Público-alvo: Professores, gestores educacionais
- Foco: Práticas inclusivas e atendimento especializado

4. GESTÃO ESCOLAR
- Duração: 14 meses
- Modalidade: Híbrida
- Investimento: R$ 159,90/mês (14x)
- Público-alvo: Gestores, coordenadores
- Certificação: Com válido para concursos públicos

5. ALFABETIZAÇÃO E LETRAMENTO
- Duração: 12 meses
- Modalidade: EAD
- Investimento: R$ 119,90/mês (12x)
- Público-alvo: Professores alfabetizadores
- Material: Cartilhas e jogos pedagógicos inclusos`,
    isActive: true,
    category: 'internal'
  },
  {
    name: 'Processos de Matrícula e Documentação',
    type: 'copilot_procedures',
    content: `PROCESSO DE MATRÍCULA - PASSO A PASSO:

DOCUMENTOS NECESSÁRIOS:
- RG e CPF (frente e verso)
- Comprovante de residência atualizado
- Diploma de graduação (frente e verso)
- Histórico escolar da graduação
- Foto 3x4 atual
- Comprovante de pagamento da primeira parcela

ETAPAS DO PROCESSO:
1. Preenchimento da ficha de inscrição online
2. Upload dos documentos digitalizados
3. Análise da documentação (até 48h úteis)
4. Confirmação da matrícula por email
5. Acesso liberado na plataforma EAD
6. Início das aulas conforme cronograma

PRAZOS IMPORTANTES:
- Matrícula: Até 15 dias antes do início das aulas
- Documentação: Deve estar completa em até 7 dias
- Primeira parcela: Vencimento no ato da matrícula
- Acesso à plataforma: Liberado em até 24h após confirmação

CASOS ESPECIAIS:
- Graduação no exterior: Necessária validação do diploma
- Documentos perdidos: Aceita declaração da instituição de origem
- Mudança de curso: Possível até 30 dias do início`,
    isActive: true,
    category: 'internal'
  },
  {
    name: 'Políticas de Pagamento e Descontos',
    type: 'copilot_financial',
    content: `FORMAS DE PAGAMENTO:

CARTÃO DE CRÉDITO:
- Parcelamento em até 18x sem juros
- Aceita Visa, Mastercard, Elo
- Débito automático disponível

BOLETO BANCÁRIO:
- Vencimento dia 10 de cada mês
- Multa de 2% após vencimento
- Juros de 1% ao mês

PIX:
- Desconto de 5% para pagamento à vista
- Disponível 24h por dia
- Confirmação instantânea

DESCONTOS DISPONÍVEIS:

PAGAMENTO À VISTA:
- 20% de desconto no valor total
- Válido para PIX ou boleto à vista
- Não cumulativo com outros descontos

CONVÊNIOS EMPRESARIAIS:
- 15% de desconto para funcionários
- Empresas parceiras cadastradas
- Necessário comprovante de vínculo

PROFISSIONAIS DA EDUCAÇÃO:
- 10% de desconto
- Válido para professores ativos
- Apresentar comprovante de atuação

INDICAÇÃO:
- 5% de desconto para quem indica
- 5% de desconto para o indicado
- Válido para novos alunos

POLÍTICAS DE CANCELAMENTO:
- Até 7 dias: Reembolso integral
- Até 30 dias: Reembolso de 80%
- Após 30 dias: Sem reembolso, mas possível transferência`,
    isActive: true,
    category: 'internal'
  },
  {
    name: 'Manual do EduChat - Funcionalidades',
    type: 'copilot_system',
    content: `GUIA DE USO DO EDUCHAT:

CAIXA DE ENTRADA:
- Visualize todas as conversas em tempo real
- Filtros: Por equipe, status, data, canal
- Busca: Por nome, telefone ou palavra-chave
- Ordenação: Por últimas mensagens ou prioridade
- Ações rápidas: Responder, transferir, arquivar

GERENCIAMENTO DE CONTATOS:
- Cadastro automático via WhatsApp
- Tags personalizáveis para organização
- Histórico completo de interações
- Notas internas para equipe
- Importação/exportação em CSV

CRM INTEGRADO:
- Funil de vendas automatizado
- Acompanhamento de leads
- Métricas de conversão
- Relatórios de performance
- Previsão de vendas

RESPOSTAS RÁPIDAS:
- Criação de templates personalizados
- Compartilhamento entre equipes
- Atalhos por palavra-chave
- Suporte a mídia (imagens, arquivos)
- Estatísticas de uso

TRANSFERÊNCIAS E HANDOFFS:
- Sistema automático por horário
- Transferência manual entre agentes
- Distribuição round-robin
- Priorização por especialização
- Histórico de transferências

RELATÓRIOS E ANALYTICS:
- Tempo médio de resposta
- Taxa de conversão por agente
- Satisfação do cliente
- Volume de atendimentos
- Análise de sentimento automática

CONFIGURAÇÕES DE EQUIPE:
- Definição de horários de funcionamento
- Capacidade máxima por agente
- Especialização por tipo de atendimento
- Metas individuais e coletivas
- Alertas e notificações`,
    isActive: true,
    category: 'internal'
  },
  {
    name: 'Políticas Institucionais e Procedimentos',
    type: 'copilot_policies',
    content: `POLÍTICAS INSTITUCIONAIS:

CÓDIGO DE CONDUTA:
- Atendimento respeitoso e profissional
- Linguagem clara e acessível
- Respostas em até 2 horas no horário comercial
- Confidencialidade das informações
- Postura ética em todas as interações

HORÁRIOS DE FUNCIONAMENTO:
- Segunda a Sexta: 8h às 18h
- Sábados: 8h às 12h
- Plantão de emergência: WhatsApp até 20h
- Feriados: Atendimento reduzido

ESCALONAMENTO DE ATENDIMENTO:

NÍVEL 1 - COMERCIAL:
- Informações sobre cursos
- Processo de matrícula
- Valores e formas de pagamento
- Agendamento de reuniões

NÍVEL 2 - SUPORTE TÉCNICO:
- Problemas na plataforma EAD
- Dificuldades de acesso
- Questões tecnológicas
- Suporte a arquivos e materiais

NÍVEL 3 - PEDAGÓGICO:
- Dúvidas sobre conteúdo
- Orientação acadêmica
- Problemas com professores
- Questões sobre avaliações

NÍVEL 4 - FINANCEIRO:
- Negociação de débitos
- Problemas com pagamentos
- Solicitação de segunda via
- Cancelamentos e reembolsos

PROTOCOLO DE EMERGÊNCIA:
- Situações críticas: Transferir para gerência
- Reclamações graves: Registrar e escalonar
- Problemas técnicos urgentes: TI em até 1h
- Questões jurídicas: Departamento legal

QUALIDADE DO ATENDIMENTO:
- Meta: 95% de satisfação
- Tempo médio de resposta: Máximo 2h
- Resolução no primeiro contato: 80%
- Follow-up em 24h para casos complexos
- Pesquisa de satisfação automática`,
    isActive: true,
    category: 'internal'
  }
];

async function setupCopilotContexts() {
  try {
    console.log('🎓 Configurando contextos do Copilot da Prof. Ana...');
    
    // Inserir todos os contextos
    for (const context of copilotContexts) {
      await db.insert(aiContext).values(context);
      console.log(`✅ Contexto adicionado: ${context.name}`);
    }
    
    console.log(`🎉 ${copilotContexts.length} contextos configurados com sucesso!`);
    console.log('📚 Base de conhecimento do Copilot está pronta para uso.');
    
  } catch (error) {
    console.error('❌ Erro ao configurar contextos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCopilotContexts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { setupCopilotContexts };