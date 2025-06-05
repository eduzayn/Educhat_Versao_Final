import { ReactNode } from 'react';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useUserPermissions, hasPermission } from '@/shared/lib/permissions';
import { useLocation } from 'wouter';

interface User {
  id: number;
  email: string;
  role: string;
  displayName: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  adminOnly?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  adminOnly = false,
  allowedRoles = []
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: userPermissions } = useUserPermissions();
  const [, setLocation] = useLocation();

  // Verificar autenticação
  if (!isAuthenticated || !user) {
    setLocation('/login');
    return null;
  }

  const userRole = (user as any)?.role || '';

  // Verificar se é admin only
  if (adminOnly && userRole !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <button 
            onClick={() => setLocation('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Sua função "{userRole}" não tem permissão para acessar esta página.
          </p>
          <button 
            onClick={() => setLocation('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Verificar permissão específica
  if (requiredPermission && userPermissions) {
    if (!hasPermission(userPermissions, requiredPermission)) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem a permissão "{requiredPermission}" necessária para acessar esta página.
            </p>
            <button 
              onClick={() => setLocation('/dashboard')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}