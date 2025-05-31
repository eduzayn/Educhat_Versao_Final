import { Bell, Settings, Search } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-educhat-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-xl font-bold text-educhat-dark">EduChat</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-educhat-medium w-4 h-4" />
            <Input
              type="text"
              placeholder="Search conversations, contacts..."
              className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-educhat-blue"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
            <Bell className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
            <Settings className="w-5 h-5" />
          </Button>

          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt="Agent" />
            <AvatarFallback className="bg-educhat-blue text-white text-sm">
              AG
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}