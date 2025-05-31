import { UserCheck } from 'lucide-react';

export function CrmPage() {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
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
  );
}

export default CrmPage;