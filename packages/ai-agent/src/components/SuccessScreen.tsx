import React, { useState } from 'react';
import { EventData, UserTier } from '@/types';

interface SuccessScreenProps {
  variant: 'launched' | 'draft';
  eventData: EventData;
  userTier: UserTier;
  manageUrl?: string;
  onLaunchDraft?: () => void;
  onEditDraft?: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  variant,
  eventData: _eventData,
  userTier,
  manageUrl,
  onLaunchDraft,
  onEditDraft,
}) => {
  const [copied, setCopied] = useState(false);

  const displayUrl = manageUrl || 'https://dev.gofevo.com/manage';

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    window.location.reload();
  };

  const handleViewDashboard = () => {
    window.open(manageUrl || 'https://dev.gofevo.com/manage', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4 animate-success-bounce">
        {variant === 'launched' ? '🎉' : '📝'}
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-bold text-black mb-2">
        {variant === 'launched' ? 'Event Launched!' : 'Draft Saved!'}
      </h1>
      <p className="text-base text-gray-600 mb-8">
        {variant === 'launched'
          ? 'Your event is now live and ready to share'
          : 'Your event is created but not live yet'}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
        {variant === 'launched' ? (
          <>
            <StatCell value="45s" label="Setup Time" />
            <StatCell value="Live" label="Status" />
            <StatCell value="0" label="Sales" />
          </>
        ) : (
          <>
            <StatCell value={String(userTier.activeEvents + 1)} label="Active Drafts" />
            <StatCell value={`${userTier.yearlyEvents + 1}/20 Free`} label="This Year" />
            <StatCell value="$0" label="Earned So Far" />
          </>
        )}
      </div>

      {/* Event URL Bar */}
      <div className="flex items-center w-full max-w-md border-2 border-yellow rounded-btn overflow-hidden mb-8">
        <div className="flex-1 px-4 py-3 text-sm font-medium text-black bg-yellow-light truncate">
          {displayUrl.replace(/^https?:\/\//, '')}
        </div>
        <button
          onClick={handleCopy}
          className="px-4 py-3 bg-yellow font-semibold text-sm text-black hover:bg-yellow-dark transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        {variant === 'launched' ? (
          <button
            onClick={handleViewDashboard}
            className="w-full py-4 bg-yellow rounded-btn text-base font-bold text-black
              hover:bg-yellow-dark hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          >
            View Dashboard
          </button>
        ) : (
          <>
            <button
              onClick={onLaunchDraft}
              className="w-full py-4 bg-yellow rounded-btn text-base font-bold text-black
                hover:bg-yellow-dark hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              🚀 Launch Event Now
            </button>
            <button
              onClick={onEditDraft}
              className="w-full py-4 bg-white border-2 border-yellow rounded-btn text-base font-bold text-black
                hover:bg-yellow-light transition-all duration-200"
            >
              ✏️ Edit Draft
            </button>
          </>
        )}
        <button
          onClick={handleCreateAnother}
          className="w-full py-4 bg-white border-2 border-gray-900 rounded-btn text-base font-bold text-black
            hover:bg-gray-50 transition-all duration-200"
        >
          Create Another Event
        </button>
      </div>
    </div>
  );
};

const StatCell: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="bg-gray-50 rounded-btn p-4 text-center">
    <div className="text-2xl font-bold text-black">{value}</div>
    <div className="text-xs text-gray-600 mt-1">{label}</div>
  </div>
);

export default SuccessScreen;
