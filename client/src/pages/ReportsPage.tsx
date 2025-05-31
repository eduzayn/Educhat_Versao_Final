import { BarChart3 } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Relatórios e Analytics
        </h1>
        <p className="text-gray-600">
          Página em desenvolvimento
        </p>
      </div>
    </div>
  );
}

export default ReportsPage;