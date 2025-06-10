import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, TestTube, Brain, Play } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

interface Macrosetor {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  keywords: Keyword[];
}

interface Keyword {
  id: number;
  macrosetorId: number;
  keyword: string;
  weight: number;
  isActive: boolean;
}

interface TestResult {
  detected: string;
  score: number;
  keywords: Array<{
    keyword: string;
    weight: number;
    macrosetor: string;
  }>;
}

export default function DetectionConfigPage() {
  const [activeTab, setActiveTab] = useState('macrosetores');
  const [selectedMacrosetor, setSelectedMacrosetor] = useState<Macrosetor | null>(null);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestingDetection, setIsTestingDetection] = useState(false);

  // Buscar macrosetores existentes
  const { data: macrosetores = [], isLoading: loadingMacrosetores } = useQuery({
    queryKey: ['/api/settings/macrosetores']
  });

  // Buscar palavras-chave do macrosetor selecionado
  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['/api/settings/macrosetores/keywords', selectedMacrosetor?.id],
    enabled: !!selectedMacrosetor
  });

  const handleTestDetection = async () => {
    if (!testText.trim()) return;
    
    setIsTestingDetection(true);
    try {
      const result = await apiRequest('POST', '/api/settings/macrosetores/test', { text: testText });
      setTestResult(result);
    } catch (error) {
      console.error('Erro ao testar detecção:', error);
    } finally {
      setIsTestingDetection(false);
    }
  };

  if (loadingMacrosetores) {
    return (
      <div className="min-h-screen bg-educhat-light">
        <div className="p-6 space-y-6">
          <BackButton to="/settings" label="Voltar às Configurações" />
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6 space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Detecção Inteligente</h2>
          <p className="text-gray-600">Visualize e teste o sistema de detecção de macrosetores configurado</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('macrosetores')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'macrosetores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Brain className="w-5 h-5" />
                Macrosetores
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'test'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TestTube className="w-5 h-5" />
                Teste de Detecção
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'macrosetores' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Macrosetores List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Macrosetores Configurados</h3>
                <span className="text-sm text-gray-500">Somente leitura</span>
              </div>

              <div className="space-y-3">
                {Array.isArray(macrosetores) && macrosetores.map((macrosetor: Macrosetor) => (
                  <div
                    key={macrosetor.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMacrosetor?.id === macrosetor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMacrosetor(macrosetor)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 capitalize">{macrosetor.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{macrosetor.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            macrosetor.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {macrosetor.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Prioridade: {macrosetor.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {macrosetor.keywords.length} palavras-chave
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">
                {selectedMacrosetor ? `Palavras-chave: ${selectedMacrosetor.name}` : 'Selecione um Macrosetor'}
              </h3>

              {selectedMacrosetor && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    Palavras e expressões que identificam mensagens do tipo "{selectedMacrosetor.name}"
                  </div>
                  
                  {/* Keywords List */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedMacrosetor.keywords.map((keyword: Keyword) => (
                      <div key={keyword.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">"{keyword.keyword}"</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Peso: {keyword.weight}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              keyword.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {keyword.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Como funciona:</strong> O sistema analisa mensagens em tempo real e atribui pontuações baseadas nas palavras-chave encontradas. 
                      Palavras com peso maior têm mais influência na classificação final.
                    </p>
                  </div>
                </div>
              )}

              {!selectedMacrosetor && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Selecione um macrosetor para ver suas palavras-chave</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Teste de Detecção</h3>
            <p className="text-gray-600 mb-6">
              Digite uma mensagem para testar como o sistema de detecção funcionaria em tempo real
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto para Teste
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Digite uma mensagem de exemplo, como: 'Gostaria de saber o valor do curso de administração' ou 'Meu boleto está em atraso'"
                />
              </div>
              
              <button
                onClick={handleTestDetection}
                disabled={!testText.trim() || isTestingDetection}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                {isTestingDetection ? 'Testando...' : 'Testar Detecção'}
              </button>
            </div>

            {testResult && (
              <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-lg mb-3">Resultado da Detecção</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Macrosetor Detectado:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      testResult.detected === 'geral' 
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {testResult.detected}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Confiança:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(testResult.score * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {Math.round(testResult.score * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      {testResult.detected === 'geral' 
                        ? 'Nenhuma palavra-chave específica foi identificada na mensagem. Ela seria classificada como "geral".'
                        : `A mensagem foi classificada como "${testResult.detected}" com base no sistema de detecção inteligente.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}