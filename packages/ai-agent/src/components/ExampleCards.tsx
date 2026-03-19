import React from 'react';
import { examplePrompts } from '@/constants/examplePrompts';

interface ExampleCardsProps {
  onSelect: (prompt: string) => void;
}

const ExampleCards: React.FC<ExampleCardsProps> = ({ onSelect }) => {
  return (
    <div className="mt-4">
      <p className="text-sm uppercase tracking-wide text-gray-600 font-semibold mb-3">
        Try these:
      </p>
      <div className="space-y-3">
        {examplePrompts.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.prompt)}
            className="w-full text-left bg-gray-50 border-2 border-gray-200 rounded-card p-4
              hover:border-yellow hover:bg-yellow-light transition-all duration-200"
          >
            <p className="text-[15px] font-medium text-black mb-1">
              &ldquo;{item.prompt}&rdquo;
            </p>
            <p className="text-xs text-gray-600">
              &rarr; {item.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleCards;
