import { MessageSquare } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Nenhuma mensagem ainda</p>
        <p className="text-sm">
          Envie uma mensagem para começar a conversa
        </p>
      </div>
    </div>
  );
}