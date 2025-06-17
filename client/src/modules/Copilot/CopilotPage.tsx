import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Spinner } from '@/shared/ui/spinner';
import { 
  GraduationCap, 
  Send, 
  User, 
  Sparkles,
  MessageSquare,
  BookOpen,
  Clock,
  Brain
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/shared/lib/hooks/useAuth';

interface User {
  id?: number;
  displayName?: string;
  username?: string;
  email?: string;
}

interface CopilotMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  classification?: {
    intent: string;
    category: string;
    confidence: number;
  };
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth() as { user: User };

  // Mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: CopilotMessage = {
        id: 'welcome-1',
        content: `Olá, ${user?.displayName || user?.username || 'colega'}! 👋

Sou a Prof. Ana, sua assistente inteligente aqui no EduChat. Estou aqui para ajudar você com:

📚 **Informações sobre cursos e produtos**
- Detalhes sobre graduação, pós-graduação e cursos técnicos
- Requisitos e processos de matrícula
- Políticas institucionais

💼 **Suporte ao trabalho**
- Como usar melhor o sistema EduChat
- Processos de vendas e atendimento
- Melhores práticas para certificação

🎯 **Conhecimento interno**
- Perguntas sobre procedimentos
- Políticas da empresa
- Orientações gerais

Como posso ajudar você hoje?`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user?.displayName, user?.username]);

  // Auto-scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Buscar histórico de conversas do copilot
  const { data: chatHistory } = useQuery({
    queryKey: ['copilot-history', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/ia/logs?mode=copilot&userId=${user?.id || ''}&limit=50`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id
  });

  // Mutation para enviar mensagem para a IA
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ia/copilot', {
        message,
        mode: 'copilot',
        userId: user?.id || 0,
        context: 'copilot_internal'
      });
      return response;
    },
    onSuccess: (response: any, message) => {
      // Adicionar resposta da IA
      const aiMessage: CopilotMessage = {
        id: `ai-${Date.now()}`,
        content: response.message || 'Desculpe, não consegui processar sua pergunta no momento.',
        isUser: false,
        timestamp: new Date(),
        confidence: response.classification?.confidence,
        classification: response.classification
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Invalidar cache do histórico para atualizar
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: CopilotMessage = {
        id: `error-${Date.now()}`,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Enviar para a IA
    sendMessageMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-blue-200">
                <AvatarImage src="/prof-ana-avatar.png" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <GraduationCap className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Prof. Ana</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Modo Copilot
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Assistente Inteligente
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Brain className="w-4 h-4" />
            <span>IA Especializada</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-6xl mx-auto w-full flex flex-col">
        <Card className="flex-1 m-4 shadow-lg">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-2xl ${
                      message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {/* Avatar */}
                      <Avatar className="w-8 h-8 mt-1">
                        {message.isUser ? (
                          <AvatarFallback className="bg-gray-500 text-white">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <GraduationCap className="w-4 h-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Message Content */}
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.isUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border shadow-sm'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          message.isUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(message.confidence * 100)}% confiança
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <GraduationCap className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">Prof. Ana está digitando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua pergunta para a Prof. Ana..."
                    className="min-h-[44px] resize-none border-gray-300 focus:border-blue-500"
                    disabled={sendMessageMutation.isPending}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Pressione Enter para enviar</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>Resposta em segundos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}