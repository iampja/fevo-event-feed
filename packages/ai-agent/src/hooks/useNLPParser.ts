import { EventData, defaultEventData } from '@/types';
import { eventTypeKeywords } from '@/constants/eventTypes';

export function parseInitialMessage(message: string): EventData {
  const eventData: EventData = { ...defaultEventData, tickets: [], dates: [] };
  const lowerMessage = message.toLowerCase();

  // 6.1 Determine Mode
  if (
    lowerMessage.includes('free') ||
    lowerMessage.includes('registration') ||
    lowerMessage.includes('register') ||
    lowerMessage.includes('rsvp')
  ) {
    eventData.mode = 'registration';
  } else {
    eventData.mode = 'ticket';
  }

  // 6.2 Detect Series / Recurring Events
  const seriesPatterns = [
    /(\d+)\s*(events?|concerts?|shows?|classes?|workshops?|sessions?)/i,
    /(weekly|daily|monthly|bi-weekly|biweekly)/i,
    /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(\d+)[-\s]+(week|day|month)\s+(series|course)/i,
  ];

  for (const pattern of seriesPatterns) {
    const match = message.match(pattern);
    if (match) {
      eventData.isSeries = true;
      const leadingNumber = match[1] ? parseInt(match[1], 10) : null;
      if (leadingNumber && !isNaN(leadingNumber) && leadingNumber < 1000) {
        eventData.seriesCount = leadingNumber;
      }

      const matchText = match[0].toLowerCase();
      if (matchText.includes('weekly') || matchText.includes('every')) {
        eventData.seriesFrequency = 'weekly';
      } else if (matchText.includes('daily')) {
        eventData.seriesFrequency = 'daily';
      } else if (matchText.includes('monthly')) {
        eventData.seriesFrequency = 'monthly';
      }

      if (eventData.seriesFrequency && !eventData.seriesCount) {
        eventData.seriesCount = 4;
      }
      break;
    }
  }

  // 6.3 Extract Location
  const locationPatterns = [
    /(?:at|@)\s+([A-Z][^\.,;]+(?:Center|Centre|Hall|Theatre|Theater|Arena|Stadium|Park|Venue|Club|Bar|Restaurant|Room|Studio|Space|Building))/i,
    /(?:at|@)\s+the\s+([A-Z][^,\.;]+)/i,
    /(?:at|@)\s+([A-Z][^,\.;]+)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      eventData.location = match[1].trim();
      break;
    }
  }

  // 6.4 Classify Event Type
  let typeFound = false;
  for (const entry of eventTypeKeywords) {
    for (const keyword of entry.keywords) {
      if (lowerMessage.includes(keyword)) {
        eventData.eventType = entry.type as EventData['eventType'];
        typeFound = true;
        break;
      }
    }
    if (typeFound) break;
  }
  if (!typeFound) {
    eventData.eventType = 'Event';
  }

  // 6.5 Extract Tickets and Pricing
  eventData.tickets = [];

  if (lowerMessage.includes('free') && !lowerMessage.includes('free shipping')) {
    eventData.tickets.push({ name: 'General Admission', price: 0, type: 'ga' });
  } else {
    const adultMatch = message.match(/\$?(\d+)\s*(?:for\s+)?(?:adults?|general)/i);
    const kidsMatch = message.match(/\$?(\d+)\s*(?:for\s+)?(?:kids?|children|youth)/i);
    const vipMatch = message.match(/\$?(\d+)\s*(?:for\s+)?(?:vip|premium)/i);
    const generalMatch = message.match(/\$?(\d+)\s*(?:\/)?(?:ticket|per\s+ticket|each|admission)/i);

    if (adultMatch && kidsMatch) {
      eventData.tickets.push({ name: 'Adult', price: Number(adultMatch[1]), type: 'adult' });
      eventData.tickets.push({ name: 'Child', price: Number(kidsMatch[1]), type: 'child' });
    } else if (vipMatch && generalMatch) {
      eventData.tickets.push({ name: 'General Admission', price: Number(generalMatch[1]), type: 'ga' });
      eventData.tickets.push({ name: 'VIP', price: Number(vipMatch[1]), type: 'vip' });
    } else if (generalMatch) {
      eventData.tickets.push({ name: 'General Admission', price: Number(generalMatch[1]), type: 'ga' });
    }
  }

  if (eventData.tickets.length === 0) {
    eventData.tickets.push({ name: 'General Admission', price: null, type: 'ga' });
  }

  // 6.6 Extract Capacity
  const capacityMatch = message.match(/(\d+)\s*(people|attendees|guests|capacity)/i);
  eventData.capacity = capacityMatch ? capacityMatch[1] : null;

  // 6.7 Extract Dates
  // Step 1: Try multi-date list
  const dateListPattern = /(\w+\s+\d+)(?:\s*,\s*(\w+\s+\d+))?(?:\s*,\s*(?:and\s+)?(\w+\s+\d+))?/i;
  const dateListMatch = message.match(dateListPattern);
  if (dateListMatch) {
    for (let i = 1; i < dateListMatch.length; i++) {
      if (dateListMatch[i]) eventData.dates.push(dateListMatch[i]);
    }
  }

  // Step 2: If still no dates, try single date
  if (eventData.dates.length === 0) {
    const singleDatePatterns = [
      /(?:on|at)\s+(\w+\s+\d+(?:,\s+\d{4})?)/i,
      /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+/i,
      /(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    ];
    for (const pattern of singleDatePatterns) {
      const match = message.match(pattern);
      if (match) {
        eventData.dates.push(match[0]);
        break;
      }
    }
  }

  // 6.8 Generate Name and Slug
  if (eventData.location) {
    const locationShort = eventData.location.split(' ')[0];
    eventData.name = `${eventData.eventType} at ${locationShort}`;
  } else {
    eventData.name = eventData.eventType;
  }
  eventData.slug = eventData.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return eventData;
}
