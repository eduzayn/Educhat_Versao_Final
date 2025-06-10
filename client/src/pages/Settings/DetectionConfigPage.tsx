import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, TestTube, Settings, Brain, FileText, Play } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

interface Macrosetor {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface Keyword {
  id: number;
  macrosetorId: number;
  keyword: string;
  weight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    isActive: true
  });
  const [keywordForm, setKeywordForm] = useState({
    keyword: '',
    weight: 1,
    isActive: true
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: macrosetores = [], isLoading: loadingMacrosetores } = useQuery({
    queryKey: ['/api/settings/macrosetores']
  });

  const { data: keywords = [], isLoading: loadingKeywords } = useQuery({
    queryKey: ['/api/settings/macrosetores/keywords', selectedMacrosetor?.id],
    enabled: !!selectedMacrosetor
  });

  // Mutations
  const createMacrosetor = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/settings/macrosetores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateMacrosetor = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/settings/macrosetores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMacrosetor = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/settings/macrosetores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores'] });
    }
  });

  const createKeyword = useMutation({
    mutationFn: ({ macrosetorId, data }: { macrosetorId: number; data: any }) => 
      apiRequest('POST', `/api/settings/macrosetores/${macrosetorId}/keywords`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores/keywords', selectedMacrosetor?.id] });
      setKeywordForm({ keyword: '', weight: 1, isActive: true });
    }
  });

  const deleteKeyword = useMutation({
    mutationFn: ({ macrosetorId, keywordId }: { macrosetorId: number; keywordId: number }) => 
      apiRequest('DELETE', `/api/settings/macrosetores/${macrosetorId}/keywords/${keywordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/macrosetores/keywords', selectedMacrosetor?.id] });
    }
  });

  const testDetection = useMutation({
    mutationFn: (text: string) => apiRequest('POST', '/api/settings/macrosetores/test', { text }),
    onSuccess: (data: any) => {
      setTestResult(data);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 1,
      isActive: true
    });
  };

  const handleCreateMacrosetor = () => {
    setModalType('create');
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditMacrosetor = (macrosetor: Macrosetor) => {
    setModalType('edit');
    setFormData({
      name: macrosetor.name,
      description: macrosetor.description,
      priority: macrosetor.priority,
      isActive: macrosetor.isActive
    });
    setSelectedMacrosetor(macrosetor);
    setIsModalOpen(true);
  };

  const handleSubmitMacrosetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'create') {
      createMacrosetor.mutate(formData);
    } else if (selectedMacrosetor) {
      updateMacrosetor.mutate({ id: selectedMacrosetor.id, data: formData });
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMacrosetor) {
      createKeyword.mutate({ 
        macrosetorId: selectedMacrosetor.id, 
        data: keywordForm 
      });
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
          <p className="text-gray-600">Configure expressões e macrosetores para classificação automática de mensagens</p>
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
                <h3 className="text-xl font-semibold">Macrosetores</h3>
                <button
                  onClick={handleCreateMacrosetor}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Macrosetor
                </button>
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
                        <h4 className="font-medium text-gray-900">{macrosetor.name}</h4>
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
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMacrosetor(macrosetor);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMacrosetor.mutate(macrosetor.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <>
                  {/* Add Keyword Form */}
                  <form onSubmit={handleAddKeyword} className="mb-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Palavra-chave
                        </label>
                        <input
                          type="text"
                          value={keywordForm.keyword}
                          onChange={(e) => setKeywordForm(prev => ({ ...prev, keyword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite a palavra-chave..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peso (1-10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={keywordForm.weight}
                          onChange={(e) => setKeywordForm(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={createKeyword.isPending}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {createKeyword.isPending ? 'Adicionando...' : 'Adicionar Palavra-chave'}
                      </button>
                    </div>
                  </form>

                  {/* Keywords List */}
                  <div className="space-y-2">
                    {Array.isArray(keywords) && keywords.map((keyword: Keyword) => (
                      <div key={keyword.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{keyword.keyword}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            Peso: {keyword.weight}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            keyword.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {keyword.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteKeyword.mutate({ 
                            macrosetorId: selectedMacrosetor.id, 
                            keywordId: keyword.id 
                          })}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Teste de Detecção</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              testDetection.mutate(testText);
            }} className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto para Teste
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Digite uma mensagem para testar a detecção..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={testDetection.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                {testDetection.isPending ? 'Testando...' : 'Testar Detecção'}
              </button>
            </form>

            {testResult && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-lg mb-3">Resultado da Detecção</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Macrosetor Detectado:</span>
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {testResult.detected}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Pontuação:</span>
                    <span className="ml-2 text-lg font-bold text-green-600">
                      {testResult.score}
                    </span>
                  </div>
                  {testResult.keywords && testResult.keywords.length > 0 && (
                    <div>
                      <span className="font-medium block mb-2">Palavras-chave Encontradas:</span>
                      <div className="space-y-1">
                        {testResult.keywords.map((kw, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span>"{kw.keyword}" ({kw.macrosetor})</span>
                            <span className="font-medium text-green-600">+{kw.weight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal for Create/Edit Macrosetor */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {modalType === 'create' ? 'Novo Macrosetor' : 'Editar Macrosetor'}
              </h3>
              
              <form onSubmit={handleSubmitMacrosetor}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Ativo
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMacrosetor.isPending || updateMacrosetor.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMacrosetor.isPending || updateMacrosetor.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}