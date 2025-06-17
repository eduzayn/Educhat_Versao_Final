import { useState, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { CRMDashboard, DealsModule, ActivitiesModule, ReportsModule, SalesModule } from "../modules";
import { CRMSettings } from "../components/CRMSettings";
import { CRMHeader } from './CRMHeader';

interface DateFilter {
  period: string;
  startDate?: Date;
  endDate?: Date;
}

interface CRMContextType {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const useCRMContext = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRMContext must be used within a CRMProvider');
  }
  return context;
};

export function CRMPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ period: 'month' });

  return (
    <CRMContext.Provider value={{ dateFilter, setDateFilter }}>
      <div className="flex flex-col h-screen">
        <CRMHeader onOpenSettings={() => setShowSettings(true)} />
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="dashboard" className="h-full">
            <TabsList className="w-full justify-between border-b rounded-none h-12 px-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 flex-1">
                <span className="icon-dashboard" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-2 flex-1">
                <span className="icon-deals" /> Negócios
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2 flex-1">
                <span className="icon-sales" /> Vendas
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2 flex-1">
                <span className="icon-activities" /> Atividades
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 flex-1">
                <span className="icon-reports" /> Relatórios
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="flex-1">
              <div className="p-6">
                <CRMDashboard />
              </div>
            </TabsContent>
            <TabsContent value="deals" className="flex-1">
              <div className="p-6">
                <DealsModule />
              </div>
            </TabsContent>
            <TabsContent value="sales" className="flex-1">
              <div className="p-6">
                <SalesModule />
              </div>
            </TabsContent>
            <TabsContent value="activities" className="flex-1">
              <div className="p-6">
                <ActivitiesModule />
              </div>
            </TabsContent>
            <TabsContent value="reports" className="flex-1">
              <div className="p-6">
                <ReportsModule />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <CRMSettings open={showSettings} onOpenChange={setShowSettings} />
      </div>
    </CRMContext.Provider>
  );
} 