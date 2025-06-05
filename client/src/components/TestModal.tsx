import { useState } from 'react';
import { SimpleModal } from './SimpleModal';
import { Button } from '@/shared/ui/ui/button';

export function TestModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Teste Modal Novo
      </Button>
      
      <SimpleModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Modal de Teste Novo"
      >
        <div className="space-y-4">
          <p>Este é um modal de teste usando implementação própria, sem shadcn/ui.</p>
          <p>Se este modal permanecer aberto, o problema está nos componentes shadcn/ui.</p>
          <p>Se ele fechar automaticamente, o problema é mais profundo no sistema.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}