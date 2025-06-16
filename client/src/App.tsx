import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useGlobalZApiMonitor } from "@/shared/lib/hooks/useGlobalZApiMonitor";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { Dashboard } from "@/modules/Dashboard/components/Dashboard";
import { Login } from "@/modules/Auth/Login";
import { InboxPage } from "@/modules/Inbox/InboxPage";
import { ContactsPage } from "@/modules/Contacts/components/ViewContactDialog/ContactsPage";
import ReportsPage from "@/modules/Reports/ReportsPage";
// Integrações agora consolidadas - redirecionar para a página existente
import FacebookIntegrationPage from "@/modules/Settings/Integrations/FacebookIntegrationPage";
import SettingsPage from "@/modules/Settings/SettingsPage";
import ChannelsPage from "@/modules/Settings/Channels";
import { UsersSettingsPage } from "@/modules/Settings/Users/UsersSettingsPage";
import { CRMPage } from "@/modules/CRM/CRMPage";
import { BIPage } from "@/modules/BI/BIPage";
import InternalChatPage from "@/modules/InternalChat/InternalChatPage";
import IAPage from "@/modules/IA/IAPage/IAPage";
import { ConfigPage } from "@/modules/IA/ConfigPage/ConfigPage";

import QuickRepliesSettingsPage from "@/modules/Settings/QuickReplies/QuickRepliesSettingsPage";
import WebhookConfigPage from "@/modules/Settings/Webhooks/WebhookConfigPage";
// Removido AIDetectionSettingsPage - agora consolidado em IntegrationsPage
import PermissionsPanel from "@/modules/Admin/PermissionsPanel";
import { ProfilePage } from "@/modules/Profile/ProfilePage";
import { HandoffsPage } from "@/modules/Handoffs/HandoffsPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Inicializar monitoramento global da Z-API
  useGlobalZApiMonitor();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary mx-auto mb-4"></div>
          <p className="text-educhat-medium">Carregando EduChat...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {!isAuthenticated ? (
        <Route path="*" component={Login} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/contacts" component={ContactsPage} />
          <Route path="/crm" component={CRMPage} />
          <Route path="/ia" component={IAPage} />
          <Route path="/ia/config" component={ConfigPage} />
          <Route path="/bi">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente"]}
                component={BIPage}
              />
            )}
          </Route>
          <Route path="/reports" component={ReportsPage} />
          <Route path="/integrations">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={FacebookIntegrationPage}
              />
            )}
          </Route>
          <Route path="/settings/integrations">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={FacebookIntegrationPage}
              />
            )}
          </Route>
          <Route path="/settings/ai-detection">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={FacebookIntegrationPage}
              />
            )}
          </Route>
          <Route path="/ia/config">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={ConfigPage}
              />
            )}
          </Route>
          <Route path="/settings/integrations/facebook">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={FacebookIntegrationPage}
              />
            )}
          </Route>
          <Route path="/settings">
            {() => <ProtectedRoute component={SettingsPage} />}
          </Route>
          <Route path="/settings/channels">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={ChannelsPage}
              />
            )}
          </Route>
          <Route path="/settings/users">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={UsersSettingsPage}
              />
            )}
          </Route>
          <Route path="/settings/quick-replies">
            {() => <ProtectedRoute component={QuickRepliesSettingsPage} />}
          </Route>
          <Route path="/settings/webhooks">
            {() => (
              <ProtectedRoute
                requiredRole={["admin", "gerente", "superadmin"]}
                component={WebhookConfigPage}
              />
            )}
          </Route>
          <Route path="/admin" component={PermissionsPanel} />
          <Route path="/admin/permissions" component={PermissionsPanel} />
          <Route path="/chat-interno" component={InternalChatPage} />
          <Route path="/internal-chat" component={InternalChatPage} />
          <Route path="/handoffs" component={HandoffsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={() => <div className="min-h-screen bg-educhat-light flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-educhat-dark mb-4">Página não encontrada</h1><p className="text-educhat-medium">A página que você está procurando não existe.</p></div></div>} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
