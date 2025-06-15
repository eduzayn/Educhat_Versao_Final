import { Textarea } from '@/shared/ui/textarea';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

export function TextArea({ value, onChange, onKeyDown, disabled }: TextAreaProps) {
  return (
    <div className="flex-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Digite sua mensagem..."
        className="min-h-[40px] max-h-[120px] resize-none"
        disabled={disabled}
        aria-label="Campo de mensagem"
        aria-multiline="true"
      />
    </div>
  );
}