import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../shared/ui/card';
import { Button } from '../../../../../shared/ui/button';
import { Input } from '../../../../../shared/ui/input';
import { Search } from 'lucide-react';

export function DocumentSearch() {
  const [documentSearch, setDocumentSearch] = useState('');

  return (
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
  );
} 