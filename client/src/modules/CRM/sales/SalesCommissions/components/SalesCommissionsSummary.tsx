import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react"

interface SalesCommissionsSummaryProps {
  totalCommissions?: number
  activeAgents?: number
  period?: string
  growth?: number
}

export function SalesCommissionsSummary({ 
  totalCommissions = 0, 
  activeAgents = 0, 
  period = "Este mês",
  growth = 0 
}: SalesCommissionsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Comissões
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {period}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Agentes Ativos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAgents}</div>
          <p className="text-xs text-muted-foreground">
            Vendedores com comissões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Crescimento
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            vs período anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Período
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Badge variant="outline">{period}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Período atual
          </p>
        </CardContent>
      </Card>
    </div>
  )
}