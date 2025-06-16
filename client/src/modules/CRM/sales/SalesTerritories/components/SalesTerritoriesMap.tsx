import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { MapPin } from "lucide-react";

export function SalesTerritoriesMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Territórios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Mapa Interativo</h3>
          <p className="text-muted-foreground mb-4">
            Visualização geográfica dos territórios será implementada com Google Maps ou Leaflet
          </p>
          <Button variant="outline">Configurar Integração de Mapas</Button>
        </div>
      </CardContent>
    </Card>
  );
} 