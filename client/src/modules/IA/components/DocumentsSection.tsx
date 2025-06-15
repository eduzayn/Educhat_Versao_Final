import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Badge } from '../../../shared/ui/badge';
import { FileText, Upload, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface ProcessedDocument {
  id: number;
  name: string;
  type: string;
  content: string;
  metadata: any;
  createdAt: string;
}

interface DocumentsSectionProps {
  recentDocuments: ProcessedDocument[] | undefined;
  documentStats: any;
  documentsLoading: boolean;
  documentStatsLoading: boolean;
}

export function DocumentsSection({
  recentDocuments,
  documentStats,
  documentsLoading,
  documentStatsLoading
}: DocumentsSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentSearch, setDocumentSearch] = useState('');

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
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {documentStatsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats?.processed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Com Erros</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats?.errors || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Páginas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats?.totalPages || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upload de Documentos */}
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

      {/* Busca de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Documentos</CardTitle>
          <CardDescription>
            Pesquise no conteúdo dos documentos processados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua busca..."
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Recentes</CardTitle>
          <CardDescription>
            Últimos documentos processados pela Prof. Ana
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : recentDocuments && recentDocuments.length > 0 ? (
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{doc.type}</Badge>
                  </div>
                  
                  {doc.metadata && (
                    <div className="text-sm text-muted-foreground">
                      {doc.metadata.pages && `${doc.metadata.pages} páginas`}
                      {doc.metadata.wordCount && ` • ${doc.metadata.wordCount} palavras`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground">
                Faça upload de documentos PDF ou DOCX para começar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}