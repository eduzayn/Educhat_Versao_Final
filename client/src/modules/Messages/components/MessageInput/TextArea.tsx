import { forwardRef } from 'react';
import { Textarea } from '@/shared/ui/textarea';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  placeholder?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ value, onChange, onKeyDown, disabled, placeholder = "Digite sua mensagem..." }, ref) => {
    return (
      <div className="flex-1">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-h-[40px] max-h-[120px] resize-none"
          disabled={disabled}
          aria-label="Campo de mensagem"
          aria-multiline="true"
        />
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';