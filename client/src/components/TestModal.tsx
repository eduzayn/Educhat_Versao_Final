import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Button } from '@/shared/ui/ui/button';

export function TestModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Teste Modal Simples
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modal de Teste</DialogTitle>
            <DialogDescription>
              Este é um modal de teste para verificar se o problema é sistêmico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Se este modal permanecer aberto, o problema está nos componentes específicos das configurações.</p>
            <p>Se ele fechar automaticamente, o problema é sistêmico.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}