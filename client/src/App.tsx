import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/ui/toaster";
import { TooltipProvider } from "@/shared/ui/ui/tooltip";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useGlobalZApiMonitor } from "@/shared/lib/hooks/useGlobalZApiMonitor";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { InboxPage } from "@/pages/InboxPage";
import ChatInternoPage from "@/pages/ChatInternoPage";
import CrmPage from "@/pages/CrmPage";
import ReportsPage from "@/pages/ReportsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import ChannelsSettingsPage from "@/pages/ChannelsSettingsPage";
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
      {!isAuthenticated ? (
        <Route path="/" component={Login} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/chat-interno" component={ChatInternoPage} />
          <Route path="/crm" component={CrmPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/payments" component={PaymentsPage} />
          <Route path="/integrations" component={IntegrationsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/settings/channels" component={ChannelsSettingsPage} />
        </>
      )}
      <Route component={NotFound} />
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
