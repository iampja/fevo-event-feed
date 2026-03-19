import React from 'react';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAgent = message.sender === 'agent';

  return (
    <div
      className={`flex gap-3 max-w-[85%] animate-slide-in ${
        isAgent ? 'self-start' : 'self-end flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
          isAgent ? 'bg-yellow' : 'bg-gray-200'
        }`}
      >
        {isAgent ? '🤖' : '👤'}
      </div>

      {/* Bubble */}
      <div>
        <div
          className={`rounded-bubble px-4 py-3 text-[15px] ${
            isAgent
              ? 'bg-yellow-light border-2 border-yellow'
              : 'bg-gray-100 border-2 border-gray-200'
          }`}
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
        {message.widget && <div className="mt-3">{message.widget}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;
