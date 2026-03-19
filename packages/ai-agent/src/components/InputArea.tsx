import React, { useRef, useEffect } from 'react';

interface InputAreaProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ inputValue, setInputValue, onSend, isTyping }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && inputValue.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Describe your event"
          placeholder="Try: 'Free registration at Highland Heights' or 'Weekly yoga classes, $20 each'"
          rows={1}
          className="flex-1 resize-none border-2 border-gray-200 rounded-input px-4 py-3 text-[15px]
            focus:outline-none focus:border-yellow transition-colors"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={onSend}
          disabled={isTyping || !inputValue.trim()}
          aria-label="Send message"
          className="w-11 h-11 rounded-full bg-yellow flex items-center justify-center flex-shrink-0
            hover:scale-105 transition-transform duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-black text-lg font-bold">&rarr;</span>
        </button>
      </div>
    </div>
  );
};

export default InputArea;
