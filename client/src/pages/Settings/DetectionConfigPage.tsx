import { AlertCircle } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

export default function DetectionConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BackButton />
          <div className="flex items-center gap-3 mt-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sistema de Detecção Removido
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                O sistema de detecção automática de mensagens foi completamente removido
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Sistema de Detecção Automática Desabilitado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                O sistema de detecção automática de macrosetores baseado em palavras-chave foi removido 
                da plataforma EduChat. As conversas agora precisam ser organizadas manualmente pelos 
                atendentes ou através de regras de atribuição de equipes.
              </p>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                <div className="text-left">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    O que foi removido:
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                    <li>Detecção automática de mensagens por palavras-chave</li>
                    <li>Categorização automática por macrosetores educacionais</li>
                    <li>Criação automática de negócios baseada no conteúdo da mensagem</li>
                    <li>Atribuição automática de equipes por tipo de mensagem</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-left">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Funcionalidades que permanecem ativas:
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Recebimento e processamento de mensagens de todos os canais</li>
                    <li>Atribuição manual de conversas para equipes</li>
                    <li>Criação manual de negócios no CRM</li>
                    <li>Sistema de tags e organização manual de contatos</li>
                    <li>Todas as demais funcionalidades do EduChat</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}