import React from 'react';
import { EventData, UserTier } from '@/types';
import { feeStructure } from '@/constants/feeStructure';

interface EventDraftPreviewProps {
  eventData: EventData;
  userTier: UserTier;
}

const EventDraftPreview: React.FC<EventDraftPreviewProps> = ({ eventData, userTier }) => {
  const sampleTicket = eventData.tickets[0];
  let feeAmount: number | null = null;
  let creatorEarns: number | null = null;

  if (sampleTicket && sampleTicket.price !== null && sampleTicket.price > 0) {
    const fee = feeStructure[userTier.plan];
    feeAmount = (sampleTicket.price * fee.percent / 100) + fee.flat;
    creatorEarns = sampleTicket.price - feeAmount;
  }

  const seriesLabel = eventData.isSeries && eventData.seriesCount
    ? ` [Series (${eventData.seriesCount} events)]`
    : '';

  return (
    <div className="bg-white border-2 border-yellow rounded-card p-4">
      <div className="font-bold text-sm mb-3">
        📋 Draft Event{seriesLabel}
      </div>
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <Row label="Type" value={`${eventData.eventType} (${eventData.mode})`} />
        <Row
          label="Location"
          value={eventData.location || 'TBD'}
          isTBD={!eventData.location}
        />
        <Row
          label="Date"
          value={eventData.dates.length > 0 ? eventData.dates.join(', ') : 'TBD'}
          isTBD={eventData.dates.length === 0}
        />
        <Row
          label="Capacity"
          value={eventData.capacity || 'TBD'}
          isTBD={!eventData.capacity}
        />

        {eventData.tickets.map((ticket, i) => (
          <Row
            key={i}
            label={ticket.name}
            value={ticket.price === null ? 'TBD' : ticket.price === 0 ? 'Free' : `$${ticket.price}`}
            isTBD={ticket.price === null}
          />
        ))}

        {creatorEarns !== null && feeAmount !== null && (
          <Row
            label="You earn per ticket"
            value={`$${creatorEarns.toFixed(2)} (after $${feeAmount.toFixed(2)} fee)`}
          />
        )}

        <Row label="Status" value="DRAFT" isTBD />
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; isTBD?: boolean }> = ({
  label,
  value,
  isTBD,
}) => (
  <div className="flex justify-between text-[13px]">
    <span className="text-gray-600">{label}</span>
    <span className={`font-semibold ${isTBD ? 'text-warning' : 'text-black'}`}>
      {value}
    </span>
  </div>
);

export default EventDraftPreview;
