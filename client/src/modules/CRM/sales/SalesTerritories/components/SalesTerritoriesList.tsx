import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { MapPin, Edit, Trash2, Plus } from "lucide-react";

interface Territory {
  id: number;
  name: string;
  description: string;
  states: string[];
  cities: string[];
  salespeople: string[];
  leadsCount: number;
  salesCount: number;
  salesValue: number;
  isActive: boolean;
}

interface SalesTerritoriesListProps {
  territories: Territory[];
  canManageTerritories: boolean;
  onEdit: (territory: Territory) => void;
  onDelete: (territoryId: number) => void;
  onCreate: () => void;
  isDeleting: boolean;
}

export function SalesTerritoriesList({
  territories,
  canManageTerritories,
  onEdit,
  onDelete,
  onCreate,
  isDeleting
}: SalesTerritoriesListProps) {
  if (territories.length === 0) {
    return (
      <div className="col-span-2">
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum território configurado</h3>
            <p className="text-muted-foreground mb-4">
              {canManageTerritories 
                ? 'Comece criando territórios para organizar sua equipe de vendas'
                : 'Nenhum território foi configurado ainda'
              }
            </p>
            {canManageTerritories && (
              <Button onClick={onCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Território
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {territories.map((territory) => (
        <Card key={territory.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{territory.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{territory.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {territory.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
                {canManageTerritories && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(territory)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(territory.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Estados Cobertos</h4>
              <div className="flex flex-wrap gap-1">
                {territory.states?.map((state, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            {territory.cities?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Cidades Principais</h4>
                <div className="flex flex-wrap gap-1">
                  {territory.cities.slice(0, 3).map((city, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                  {territory.cities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{territory.cities.length - 3} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Vendedores</h4>
              <div className="flex flex-wrap gap-1">
                {territory.salespeople?.map((person, index) => (
                  <Badge key={index} className="text-xs">
                    {person}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{territory.leadsCount || 0}</div>
                <div className="text-xs text-muted-foreground">Leads</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{territory.salesCount || 0}</div>
                <div className="text-xs text-muted-foreground">Vendas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  R$ {territory.salesValue?.toLocaleString('pt-BR') || '0'}
                </div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 