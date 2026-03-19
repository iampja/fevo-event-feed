import React from 'react';

export interface ActionButton {
  label: string;
  action: () => void;
  variant?: 'pill' | 'primary';
}

interface QuickActionButtonsProps {
  actions: ActionButton[];
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ actions }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((btn, i) =>
        btn.variant === 'primary' ? (
          <button
            key={i}
            onClick={btn.action}
            aria-label={btn.label}
            className="w-full py-4 bg-yellow rounded-btn text-base font-bold text-black
              hover:bg-yellow-dark hover:-translate-y-0.5 hover:shadow-lg
              transition-all duration-200 mt-2"
          >
            {btn.label}
          </button>
        ) : (
          <button
            key={i}
            onClick={btn.action}
            aria-label={btn.label}
            className="bg-white border-2 border-gray-200 rounded-pill px-4 py-2 text-[13px] font-semibold text-black
              hover:border-yellow hover:bg-yellow-light transition-all duration-200"
          >
            {btn.label}
          </button>
        )
      )}
    </div>
  );
};

export default QuickActionButtons;
