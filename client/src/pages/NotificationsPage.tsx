import React from "react";
import { NotificationPreferences } from "@/components/NotificationPreferences";

export function NotificationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Preferências de Notificação
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Configure como e quando receber notificações do sistema
        </p>
      </div>
      
      <NotificationPreferences />
    </div>
  );
}