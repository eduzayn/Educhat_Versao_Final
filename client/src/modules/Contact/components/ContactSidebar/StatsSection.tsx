interface StatsSectionProps {
  messagesCount: number;
  dealsCount: number;
  notesCount: number;
  isOnline?: boolean;
}

export function StatsSection({ messagesCount, dealsCount, notesCount, isOnline }: StatsSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-gray-900">Resumo</h4>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-purple-50 p-2 rounded text-center">
          <div className="font-semibold text-purple-700">
            {messagesCount}
          </div>
          <div className="text-purple-600">Mensagens</div>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <div className="font-semibold text-green-700">
            {dealsCount}
          </div>
          <div className="text-green-600">Negócios</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        <div className="bg-blue-50 p-2 rounded text-center">
          <div className="font-semibold text-blue-700">
            {notesCount}
          </div>
          <div className="text-blue-600">Notas</div>
        </div>
        <div className="bg-orange-50 p-2 rounded text-center">
          <div className="font-semibold text-orange-700">
            {isOnline ? 'On' : 'Off'}
          </div>
          <div className="text-orange-600">Status</div>
        </div>
      </div>
    </div>
  );
}