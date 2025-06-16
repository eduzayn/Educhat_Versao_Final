import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { Badge } from '../../../../../shared/ui/badge';
import { FileText } from 'lucide-react';
import { ProcessedDocument } from '../types';

interface RecentDocumentsProps {
  documents: ProcessedDocument[] | undefined;
  isLoading: boolean;
}

export function RecentDocuments({ documents, isLoading }: RecentDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Recentes</CardTitle>
        <CardDescription>
          Últimos documentos processados pela Prof. Ana
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
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
  );
} 