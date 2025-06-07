import { MessageSquare } from 'lucide-react';

export function EmptyConversationState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
        <p>Escolha uma conversa da lista para começar a responder</p>
      </div>
    </div>
  );
}