import { UserCheck } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

export function CrmPage() {
  return (
    <div className="h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/" label="Voltar ao Dashboard" />
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <UserCheck className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              CRM - Gestão de Leads
            </h1>
            <p className="text-gray-600">
              Página em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrmPage;