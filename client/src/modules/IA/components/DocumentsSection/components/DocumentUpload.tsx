import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { Button } from '../../../../../shared/ui/button';
import { FileText, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Falha no upload do documento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
      setSelectedFile(null);
      setUploadProgress(0);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadDocumentMutation.mutate(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Documentos PDF/DOCX</CardTitle>
        <CardDescription>
          Envie documentos para treinar a Prof. Ana com conteúdo específico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
              id="document-upload"
            />
            <label
              htmlFor="document-upload"
              className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
            >
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-medium">
                  Clique para selecionar um documento
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX até 10MB
                </p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          )}
        </div>

        {uploadDocumentMutation.isPending && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 