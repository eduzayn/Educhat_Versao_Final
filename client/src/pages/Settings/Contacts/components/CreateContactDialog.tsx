import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Badge } from '@/shared/ui/ui/badge';
import { X, Plus } from 'lucide-react';

interface CreateContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    contactType: string;
    owner: string;
    notes: string;
  };
  onFormChange: (form: any) => void;
  newTags: string[];
  onTagsChange: (tags: string[]) => void;
  currentTag: string;
  onCurrentTagChange: (tag: string) => void;
  isWhatsAppAvailable: boolean;
  isCreating: boolean;
}

export function CreateContactDialog({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  newTags,
  onTagsChange,
  currentTag,
  onCurrentTagChange,
  isWhatsAppAvailable,
  isCreating
}: CreateContactDialogProps) {
  const handleAddTag = () => {
    if (currentTag.trim() && !newTags.includes(currentTag.trim())) {
      onTagsChange([...newTags, currentTag.trim()]);
      onCurrentTagChange('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Novo Contato</DialogTitle>
          {isWhatsAppAvailable && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md mt-2">
              ✓ Contatos com telefone serão automaticamente adicionados ao seu WhatsApp
            </p>
          )}
          {!isWhatsAppAvailable && (
            <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md mt-2">
              ⚠ WhatsApp não conectado. Configure nas Configurações → Canais para sincronização automática
            </p>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Nome completo */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nome completo</label>
            <Input
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Nome do contato"
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="w-full"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
            <Input
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
            <Input
              value={form.company}
              onChange={(e) => onFormChange({ ...form, company: e.target.value })}
              placeholder="Nome da empresa"
              className="w-full"
            />
          </div>

          {/* Tipo de contato */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
            <Select value={form.contactType} onValueChange={(value) => onFormChange({ ...form, contactType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Parceiro">Parceiro</SelectItem>
                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Endereço */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
            <Input
              value={form.address}
              onChange={(e) => onFormChange({ ...form, address: e.target.value })}
              placeholder="Endereço completo"
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => onCurrentTagChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma tag"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Observações</label>
            <Textarea
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Observações sobre o contato..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!form.name.trim() || isCreating}
          >
            {isCreating ? 'Criando...' : 'Criar Contato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}