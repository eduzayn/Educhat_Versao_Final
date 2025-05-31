import { MessageCircle } from 'lucide-react';

export function ChatInternoPage() {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Chat Interno
        </h1>
        <p className="text-gray-600">
          Página em desenvolvimento
        </p>
      </div>
    </div>
  );
}

export default ChatInternoPage;