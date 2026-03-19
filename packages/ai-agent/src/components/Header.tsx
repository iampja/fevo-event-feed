import React from 'react';
import { UserTier } from '@/types';

interface HeaderProps {
  userTier: UserTier;
}

const Header: React.FC<HeaderProps> = ({ userTier }) => {
  const [activeMode, setActiveMode] = React.useState<'ai' | 'manual'>('ai');

  const handleModeToggle = (mode: 'ai' | 'manual') => {
    if (mode === 'manual') {
      const confirmed = window.confirm('Switch to manual form? This will open in a new tab.');
      if (confirmed) {
        window.open('/manual-form', '_blank');
      }
      return;
    }
    setActiveMode(mode);
  };

  const planLabel = userTier.plan === 'free'
    ? `Free: ${userTier.activeEvents}/${userTier.limits.free.active} active`
    : userTier.plan === 'pro'
      ? 'Pro: Unlimited'
      : 'Enterprise';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-yellow flex items-center justify-center">
          <span className="text-[10px] font-black text-black leading-tight text-center">
            FE<br />VO
          </span>
        </div>
      </div>

      {/* Tier Badge */}
      <div className="bg-gray-100 rounded-pill px-2 py-1 text-xs font-semibold text-gray-900">
        {planLabel}
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-btn p-0.5">
        <button
          onClick={() => handleModeToggle('ai')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeMode === 'ai'
              ? 'bg-white shadow text-black'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          AI Agent
        </button>
        <button
          onClick={() => handleModeToggle('manual')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeMode === 'manual'
              ? 'bg-white shadow text-black'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          Manual
        </button>
      </div>
    </header>
  );
};

export default Header;
