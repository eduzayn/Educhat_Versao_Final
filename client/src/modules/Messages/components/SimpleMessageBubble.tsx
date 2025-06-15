import { memo } from "react";
import type { Message, Contact } from "@shared/schema";

interface SimpleMessageBubbleProps {
  message: Message;
  contact: Contact;
}

export const SimpleMessageBubble = memo(function SimpleMessageBubble({
  message,
  contact,
}: SimpleMessageBubbleProps) {
  const isFromContact = message.isFromContact;
  
  return (
    <div className="mb-4 w-full">
      <div className={`flex ${isFromContact ? 'justify-start' : 'justify-end'}`}>
        <div 
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isFromContact 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-blue-600 text-white'
          }`}
          style={{ display: 'block', visibility: 'visible' }}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>
      </div>
    </div>
  );
});