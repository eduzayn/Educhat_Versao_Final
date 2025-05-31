import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* EduChat Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-educhat-blue rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-educhat-blue text-lg font-bold">e</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-educhat-dark">EduChat</h1>
            <p className="text-xs text-educhat-medium">Omnichannel Communication</p>
          </div>
        </div>
        
        <div className="h-8 w-px bg-gray-200"></div>
        
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-educhat-blue font-medium flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Inbox</span>
          </a>
          <a href="#" className="text-educhat-medium hover:text-educhat-blue">Contacts</a>
          <a href="#" className="text-educhat-medium hover:text-educhat-blue">Reports</a>
          <a href="#" className="text-educhat-medium hover:text-educhat-blue">Settings</a>
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2 text-educhat-medium hover:text-educhat-blue">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-educhat-dark">Maria Silva</p>
            <p className="text-xs text-educhat-medium">Support Agent</p>
          </div>
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" alt="User Avatar" />
            <AvatarFallback>MS</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
