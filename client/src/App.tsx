import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/ui/toaster";
import { TooltipProvider } from "@/shared/ui/ui/tooltip";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useGlobalZApiMonitor } from "@/shared/lib/hooks/useGlobalZApiMonitor";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { InboxPageRefactored as InboxPage } from "@/pages/Inbox/InboxPageRefactored";
import { ContactsPageRefactored as ContactsPage } from "@/pages/Contacts/ContactsPageRefactored";
import ReportsPage from "@/pages/ReportsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import ChannelsPage from "@/pages/Settings/ChannelsPage";
import { UsersSettingsPage } from "@/pages/Settings/Users/UsersSettingsPage";
import { CRMPage } from "@/pages/CRM/CRMPage";
import { BIPage } from "@/pages/BI/BIPage";
import InternalChatPage from "@/pages/InternalChat/InternalChatPage";

import QuickRepliesSettingsPage from "@/pages/QuickRepliesSettingsPage";
import WebhookConfigPage from "@/pages/WebhookConfigPage";
import { AIDetectionSettingsPage } from "@/pages/Settings/AIDetection/AIDetectionSettingsPage";
import PermissionsPanel from "@/pages/Admin/PermissionsPanel";
import { ProfilePage } from "@/pages/ProfilePage";


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
          <Route path="/bi">
            {() => <ProtectedRoute requiredRole={['admin', 'gerente']} component={BIPage} />}
          </Route>
          <Route path="/reports" component={ReportsPage} />
          <Route path="/integrations">
            {() => <ProtectedRoute requiredRole={['admin', 'gerente']} component={IntegrationsPage} />}
          </Route>
          <Route path="/settings">
            {() => <ProtectedRoute component={SettingsPage} />}
          </Route>
          <Route path="/settings/channels">
            {() => <ProtectedRoute component={ChannelsPage} />}
          </Route>
          <Route path="/settings/users">
            {() => <ProtectedRoute component={UsersSettingsPage} />}
          </Route>
          <Route path="/settings/quick-replies">
            {() => <ProtectedRoute component={QuickRepliesSettingsPage} />}
          </Route>
          <Route path="/settings/webhooks">
            {() => <ProtectedRoute component={WebhookConfigPage} />}
          </Route>
          <Route path="/settings/ai-detection">
            {() => <ProtectedRoute component={AIDetectionSettingsPage} />}
          </Route>
          <Route path="/admin" component={PermissionsPanel} />
          <Route path="/chat-interno" component={InternalChatPage} />
          <Route path="/profile">
            {() => <ProtectedRoute component={ProfilePage} />}
          </Route>
          <Route>
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h1>
                <p className="text-gray-600">A página solicitada não existe.</p>
              </div>
            </div>
          </Route>
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
