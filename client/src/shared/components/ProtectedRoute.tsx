import { useAuth } from '@/shared/lib/hooks/useAuth';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  component?: React.ComponentType;
}

export function ProtectedRoute({ children, requiredRole = 'admin', component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary mx-auto mb-4"></div>
          <p className="text-educhat-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem o role necessário
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta área. 
              Esta seção é restrita a administradores do sistema.
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <AlertCircle className="w-4 h-4 mr-2" />
              Seu nível de acesso: {user?.role || 'Não definido'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se um componente específico foi passado, renderizá-lo
  if (Component) {
    return <Component />;
  }

  // Caso contrário, renderizar os children
  return <>{children}</>;
}