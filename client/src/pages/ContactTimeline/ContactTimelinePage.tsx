import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { UnifiedTimeline } from '@/components/UnifiedTimeline';
import { BackButton } from '@/shared/components/BackButton';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { Skeleton } from '@/shared/ui/ui/skeleton';

export function ContactTimelinePage() {
  const [match, params] = useRoute('/contacts/:contactId/timeline');
  const contactId = params?.contactId ? parseInt(params.contactId) : null;

  const { data: contact, isLoading: loadingContact } = useQuery({
    queryKey: ['/api/contacts', contactId],
    enabled: !!contactId,
  });

  if (!contactId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Contato não encontrado</h1>
            <p className="text-gray-600 mb-4">ID do contato inválido ou não fornecido</p>
            <BackButton to="/contacts" label="Voltar para Contatos" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingContact) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-48 mb-4" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Contato não encontrado</h1>
            <p className="text-gray-600 mb-4">O contato solicitado não existe no sistema</p>
            <BackButton to="/contacts" label="Voltar para Contatos" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <BackButton to="/contacts" label="Voltar para Contatos" className="mb-6" />
      </div>
      
      <Card className="mx-6 mb-6">
        <UnifiedTimeline contactId={contactId} contact={contact} />
      </Card>
    </div>
  );
}