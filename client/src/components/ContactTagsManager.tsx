import React, { useState } from 'react';
import { Plus, X, Tag, Edit2, Check, Palette, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useUserTags, 
  useContactTags, 
  useCreateUserTag, 
  useUpdateUserTag, 
  useDeleteUserTag,
  useApplyTagToContact,
  useRemoveTagFromContact 
} from '@/hooks/useUserTags';

interface ContactTagsManagerProps {
  contactId: number;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

export function ContactTagsManager({ contactId }: ContactTagsManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  // Queries
  const { data: userTags = [], isLoading: userTagsLoading } = useUserTags();
  const { data: contactTags = [], isLoading: contactTagsLoading } = useContactTags(contactId);

  // Mutations
  const createTagMutation = useCreateUserTag();
  const updateTagMutation = useUpdateUserTag();
  const deleteTagMutation = useDeleteUserTag();
  const applyTagMutation = useApplyTagToContact();
  const removeTagMutation = useRemoveTagFromContact();

  // Lógica para determinar tags disponíveis e aplicadas
  const appliedTagIds = contactTags.map(tag => tag.id);
  const availableTags = userTags.filter(tag => !appliedTagIds.includes(tag.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    await createTagMutation.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor,
      description: ''
    });

    setNewTagName('');
    setNewTagColor('#3b82f6');
    setShowCreateForm(false);
  };

  const handleUpdateTag = async (tagId: number) => {
    if (!editTagName.trim()) return;

    await updateTagMutation.mutateAsync({
      id: tagId,
      data: {
        name: editTagName.trim(),
        color: editTagColor
      }
    });

    setEditingTag(null);
    setEditTagName('');
    setEditTagColor('');
  };

  const handleDeleteTag = async (tagId: number) => {
    if (confirm('Tem certeza que deseja deletar esta tag? Esta ação não pode ser desfeita.')) {
      await deleteTagMutation.mutateAsync(tagId);
    }
  };

  const handleApplyTag = async (tagId: number) => {
    await applyTagMutation.mutateAsync({ tagId, contactId });
  };

  const handleRemoveTag = async (tagId: number) => {
    await removeTagMutation.mutateAsync({ tagId, contactId });
  };

  const startEditTag = (tag: any) => {
    setEditingTag(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || '#3b82f6');
  };

  if (userTagsLoading || contactTagsLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span className="text-sm font-medium">Tags do Contato</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span className="text-sm font-medium">Tags do Contato</span>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag-name">Nome da Tag</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Digite o nome da tag"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Cor da Tag</Label>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                    style={{ backgroundColor: newTagColor }}
                  />
                  <div className="grid grid-cols-10 gap-1 flex-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTagMutation.isPending}
                >
                  {createTagMutation.isPending ? 'Criando...' : 'Criar Tag'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags aplicadas ao contato */}
      <div className="space-y-2">
        {contactTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contactTags.map((tag) => (
              <div key={tag.id} className="group relative">
                {editingTag === tag.id ? (
                  <div className="flex items-center gap-1 p-1 bg-gray-50 rounded">
                    <Input
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="h-6 text-xs w-20"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Palette className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => setEditTagColor(color)}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleUpdateTag(tag.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                    className="text-white pr-1 cursor-pointer"
                  >
                    {tag.name}
                    <div className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditTag(tag)}
                        className="hover:bg-white/20 rounded p-0.5"
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="hover:bg-white/20 rounded p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma tag aplicada</p>
        )}
      </div>

      {/* Tags disponíveis para aplicar */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Tags Disponíveis</Label>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="cursor-pointer hover:bg-gray-50"
                style={{ borderColor: tag.color || '#3b82f6' }}
                onClick={() => handleApplyTag(tag.id)}
              >
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                />
                {tag.name}
                <Plus className="h-2.5 w-2.5 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem se não há tags */}
      {userTags.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você ainda não criou nenhuma tag. Clique no botão + para criar sua primeira tag.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}