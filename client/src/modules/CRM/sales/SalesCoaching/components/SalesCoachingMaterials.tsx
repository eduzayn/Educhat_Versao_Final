import { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { 
  Upload,
  FileText,
  Trash,
  Download,
  File,
  FileType,
  FileImage,
  FileVideo
} from "lucide-react";

interface Material {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'image' | 'video';
  url: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface SalesCoachingMaterialsProps {
  materials: Material[];
  canUpload: boolean;
}

export function SalesCoachingMaterials({ materials, canUpload }: SalesCoachingMaterialsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/sales/coaching/materials', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Erro ao fazer upload');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/coaching/materials'] });
      setSelectedFile(null);
      setUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const response = await fetch(`/api/sales/coaching/materials/${materialId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar material');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/coaching/materials'] });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('file', selectedFile);

    try {
      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'video': return <FileVideo className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materiais de Treinamento</CardTitle>
      </CardHeader>
      <CardContent>
        {canUpload && (
          <form onSubmit={handleUpload} className="mb-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Guia de Vendas"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="process">Processos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                placeholder="Descreva o material..."
                required
              />
            </div>

            <div>
              <Label htmlFor="file">Arquivo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                />
                <Button 
                  type="submit" 
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {materials.map((material) => (
            <div 
              key={material.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {getFileIcon(material.type)}
                </div>
                <div>
                  <h4 className="font-medium">{material.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {material.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Categoria: {material.category}</span>
                    <span>•</span>
                    <span>Enviado por: {material.uploadedBy}</span>
                    <span>•</span>
                    <span>Data: {new Date(material.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(material.url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canUpload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(material.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum material de treinamento encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 