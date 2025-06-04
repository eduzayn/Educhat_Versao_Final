import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/ui/toaster";
import { TooltipProvider } from "@/shared/ui/ui/tooltip";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useGlobalZApiMonitor } from "@/shared/lib/hooks/useGlobalZApiMonitor";
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

import QuickRepliesSettingsPage from "@/pages/QuickRepliesSettingsPage";
import WebhookConfigPage from "@/pages/WebhookConfigPage";
import NotFound from "@/pages/not-found";

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
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/contacts" component={ContactsPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/integrations" component={IntegrationsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/settings/channels" component={ChannelsPage} />
          <Route path="/settings/users" component={UsersSettingsPage} />
          <Route path="/settings/quick-replies" component={QuickRepliesSettingsPage} />
          <Route path="/settings/webhook" component={WebhookConfigPage} />
          <Route component={NotFound} />
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
