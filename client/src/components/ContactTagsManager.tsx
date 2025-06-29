import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { 
  useUserTags, 
  useContactTags, 
  useCreateUserTag, 
  useApplyTagToContact,
  useRemoveTagFromContact 
} from '@/hooks/useUserTags';
import { UserTag } from '../../../shared/schema';

// Cores disponíveis para as tags
const AVAILABLE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

interface ContactTagsManagerProps {
  contactId: number;
}

export function ContactTagsManager({ contactId }: ContactTagsManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(AVAILABLE_COLORS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Hooks
  const { data: userTags, isLoading: userTagsLoading } = useUserTags();
  const { data: contactTags, isLoading: contactTagsLoading, refetch: refetchContactTags } = useContactTags(contactId);
  const createTagMutation = useCreateUserTag();
  const applyTagMutation = useApplyTagToContact();
  const removeTagMutation = useRemoveTagFromContact();

  // Verificar se o contato tem uma tag específica
  const contactHasTag = (tagId: number) => {
    if (!contactTags || !Array.isArray(contactTags)) return false;
    return (contactTags as UserTag[]).some((tag: UserTag) => tag.id === tagId);
  };

  // Filtrar tags disponíveis (que o usuário não tem ainda)
  const availableTags = userTags && Array.isArray(userTags) ? 
    (userTags as UserTag[]).filter((tag: UserTag) => !contactHasTag(tag.id)) : [];

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    await createTagMutation.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor
    });

    setNewTagName('');
    setNewTagColor(AVAILABLE_COLORS[0]);
    setShowCreateForm(false);
  };

  const handleApplyTag = async (tagId: number) => {
    await applyTagMutation.mutateAsync({ tagId, contactId });
    refetchContactTags();
  };

  const handleRemoveTag = async (tagId: number) => {
    await removeTagMutation.mutateAsync({ tagId, contactId });
    refetchContactTags();
  };

  if (userTagsLoading || contactTagsLoading) {
    return <div className="p-4 text-center text-gray-500">Carregando tags...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tags aplicadas ao contato */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Tag className="h-4 w-4 mr-1" />
          Tags do Contato
        </h3>
        
        {contactTags && Array.isArray(contactTags) && contactTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(contactTags as UserTag[]).map((tag: UserTag) => (
              <Badge 
                key={tag.id}
                style={{ backgroundColor: tag.color, color: 'white' }}
                className="flex items-center gap-1"
              >
                {tag.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-white hover:text-red-200"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma tag aplicada</p>
        )}
      </div>

      {/* Tags disponíveis para aplicar */}
      {availableTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tags Disponíveis</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag: UserTag) => (
              <Badge 
                key={tag.id}
                variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                onClick={() => handleApplyTag(tag.id)}
              >
                <Plus className="h-3 w-3" />
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Criar nova tag */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Criar Nova Tag</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Nova Tag
          </Button>
        </div>

        {/* Formulário de criação */}
        {showCreateForm && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div>
              <Label htmlFor="new-tag-name">Nome da Tag</Label>
              <Input
                id="new-tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Digite o nome da tag"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {AVAILABLE_COLORS.map(color => (
                  <div
                    key={color}
                    className={`w-6 h-6 rounded-full cursor-pointer border-2 ${
                      newTagColor === color ? 'border-gray-600' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={createTagMutation.isPending || !newTagName.trim()}
              >
                Criar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTagName('');
                  setNewTagColor(AVAILABLE_COLORS[0]);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}