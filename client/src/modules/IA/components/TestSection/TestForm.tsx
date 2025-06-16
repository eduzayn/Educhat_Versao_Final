import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Send } from 'lucide-react';

interface TestFormProps {
  testMessage: string;
  setTestMessage: (message: string) => void;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TestForm({ testMessage, setTestMessage, isPending, onSubmit }: TestFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Digite uma mensagem para testar a IA..."
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isPending || !testMessage.trim()}
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
} 