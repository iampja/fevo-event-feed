import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div
      className="flex gap-3 max-w-[85%] self-start animate-slide-in"
      role="status"
      aria-label="Agent is typing"
    >
      <div className="w-9 h-9 rounded-full bg-yellow flex items-center justify-center flex-shrink-0 text-sm">
        🤖
      </div>
      <div className="bg-yellow-light border-2 border-yellow rounded-bubble px-4 py-3 flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-gray-600 animate-dot-bounce"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-600 animate-dot-bounce"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-600 animate-dot-bounce"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
