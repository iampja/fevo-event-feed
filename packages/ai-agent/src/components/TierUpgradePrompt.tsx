import React from 'react';

interface TierUpgradePromptProps {
  eventsNeeded: number;
  exceedsActive: boolean;
  exceedsYearly: boolean;
  activeEvents: number;
  yearlyEvents: number;
  remaining: number;
  onUpgrade: () => void;
  onCreateFewer: () => void;
  onCancel: () => void;
}

const TierUpgradePrompt: React.FC<TierUpgradePromptProps> = ({
  eventsNeeded,
  exceedsActive,
  exceedsYearly,
  activeEvents,
  yearlyEvents,
  remaining,
  onUpgrade,
  onCreateFewer,
  onCancel,
}) => {
  return (
    <div className="bg-[#fff9e6] border-2 border-yellow rounded-card p-4">
      <p className="font-bold text-sm mb-2">
        ⚠️ This {eventsNeeded > 1 ? 'series' : 'event'} requires {eventsNeeded} event(s)
      </p>

      <div className="border-t border-yellow/30 pt-3 mb-3">
        <p className="text-sm font-semibold mb-2">💎 Upgrade to Pro</p>

        {exceedsActive && (
          <p className="text-[13px] text-gray-600 mb-1">
            Your Free plan allows 5 active events. You currently have {activeEvents} active.
          </p>
        )}
        {exceedsYearly && (
          <p className="text-[13px] text-gray-600 mb-1">
            Your Free plan allows 20 events per year. You have {20 - yearlyEvents} remaining this year.
          </p>
        )}

        <p className="text-sm font-semibold mt-3 mb-2">Pro Plan - $39/month:</p>
        <ul className="text-[13px] text-gray-900 space-y-1 mb-4">
          <li>✓ Unlimited events</li>
          <li>✓ Lower fees (3% + $0.50 vs 5% + $0.99)</li>
          <li>✓ Group pricing &amp; add-ons</li>
          <li>✓ Remove FEVO branding</li>
          <li>✓ Priority support</li>
        </ul>
      </div>

      <div className="space-y-2">
        <button
          onClick={onUpgrade}
          className="w-full py-3 bg-yellow rounded-btn text-sm font-bold text-black
            hover:bg-yellow-dark transition-all duration-200"
        >
          Upgrade to Pro - $39/mo
        </button>
        <div className="flex gap-2">
          {remaining > 0 && (
            <button
              onClick={onCreateFewer}
              className="flex-1 bg-white border-2 border-gray-200 rounded-pill px-4 py-2 text-[13px] font-semibold
                hover:border-yellow hover:bg-yellow-light transition-all duration-200"
            >
              Create Fewer Events
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 bg-white border-2 border-gray-200 rounded-pill px-4 py-2 text-[13px] font-semibold
              hover:border-yellow hover:bg-yellow-light transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierUpgradePrompt;
