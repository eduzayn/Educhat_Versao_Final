import { Phone, Video, MoreVertical, Mail, MapPin, Calendar, CreditCard, StickyNote } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Separator } from '@/shared/ui/ui/separator';
import { useChatStore } from '@/shared/store/store/chatStore';
import { CHANNELS } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

export function ContactPanel() {
  const { activeConversation } = useChatStore();

  if (!activeConversation) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-user text-gray-400 text-2xl" />
          </div>
          <p className="text-educhat-medium">Select a conversation to view contact details</p>
        </div>
      </div>
    );
  }

  const { contact } = activeConversation;
  const channel = CHANNELS[activeConversation.channel];
  const lastSeen = contact.lastSeenAt 
    ? formatDistanceToNow(new Date(contact.lastSeenAt), { addSuffix: true })
    : 'Never';

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto scroll-area">
      {/* Contact Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-educhat-dark">Contact Details</h3>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 text-educhat-medium hover:text-educhat-blue">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src={contact.profileImageUrl || ''} alt={contact.name} />
            <AvatarFallback className="text-lg">
              {contact.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-lg font-semibold text-educhat-dark">{contact.name}</h3>
          {contact.phone && (
            <p className="text-educhat-medium">{contact.phone}</p>
          )}
          
          <div className="flex items-center justify-center space-x-1 mt-2">
            <span className={`w-2 h-2 rounded-full ${contact.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
            <span className={`text-sm ${contact.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {contact.isOnline ? 'Online' : `Last seen ${lastSeen}`}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-educhat-dark mb-3">Contact Information</h4>
          <div className="space-y-3">
            {contact.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-educhat-medium" />
                <span className="text-sm text-educhat-dark">{contact.email}</span>
              </div>
            )}
            
            {contact.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-educhat-medium" />
                <span className="text-sm text-educhat-dark">{contact.location}</span>
              </div>
            )}
            
            {contact.age && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-educhat-medium" />
                <span className="text-sm text-educhat-dark">{contact.age} anos</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Tags */}
        <div>
          <h4 className="text-sm font-semibold text-educhat-dark mb-3">Tags</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Lead</Badge>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Interessado</Badge>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Dev Web</Badge>
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-semibold text-educhat-dark mb-3">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-educhat-dark">Started conversation</p>
                <p className="text-xs text-educhat-medium">
                  {formatDistanceToNow(new Date(activeConversation.createdAt || new Date()), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-educhat-dark">Interested in courses</p>
                <p className="text-xs text-educhat-medium">
                  {formatDistanceToNow(new Date(activeConversation.createdAt || new Date()), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* CRM Actions */}
        <div>
          <h4 className="text-sm font-semibold text-educhat-dark mb-3">Actions</h4>
          <div className="space-y-2">
            <Button className="w-full bg-educhat-blue text-white hover:bg-blue-600 transition-colors">
              <CreditCard className="w-4 h-4 mr-2" />
              Generate Payment
            </Button>
            
            <Button className="w-full bg-green-500 text-white hover:bg-green-600 transition-colors">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Call
            </Button>
            
            <Button variant="outline" className="w-full">
              <StickyNote className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        <Separator />

        {/* Connected Channels */}
        <div>
          <h4 className="text-sm font-semibold text-educhat-dark mb-3">Connected Channels</h4>
          <div className="space-y-2">
            {Object.entries(CHANNELS).map(([key, channelInfo]) => {
              const isActive = key === activeConversation.channel;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className={`${channelInfo.icon} ${channelInfo.color}`} />
                    <span className="text-sm text-educhat-dark">{channelInfo.name}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}