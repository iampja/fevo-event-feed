import { ReactNode } from 'react';

export interface Ticket {
  name: string;
  price: number | null;
  type: 'ga' | 'vip' | 'adult' | 'child';
}

export interface EventData {
  name: string | null;
  slug: string | null;
  eventType: 'Concert' | 'Festival' | 'Workshop' | 'Class' | 'Comedy Show' | 'Meetup' | 'Event';
  mode: 'ticket' | 'registration';
  isSeries: boolean;
  seriesCount: number | null;
  seriesFrequency: 'daily' | 'weekly' | 'monthly' | null;
  location: string | null;
  dates: string[];
  capacity: string | null;
  tickets: Ticket[];
  hasGroups: boolean;
  hasAddons: boolean;
  hasRewards: boolean;
}

export interface UserTier {
  plan: 'free' | 'pro' | 'enterprise';
  activeEvents: number;
  yearlyEvents: number;
  limits: {
    free: { active: number; yearly: number };
    pro: { active: number; yearly: number };
  };
}

export interface Message {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  widget?: ReactNode;
  timestamp: Date;
}

export interface FeeStructure {
  percent: number;
  flat: number;
}

export const defaultEventData: EventData = {
  name: null,
  slug: null,
  eventType: 'Event',
  mode: 'ticket',
  isSeries: false,
  seriesCount: null,
  seriesFrequency: null,
  location: null,
  dates: [],
  capacity: null,
  tickets: [],
  hasGroups: false,
  hasAddons: false,
  hasRewards: false,
};

export const defaultUserTier: UserTier = {
  plan: 'free',
  activeEvents: 2,
  yearlyEvents: 8,
  limits: {
    free: { active: 5, yearly: 20 },
    pro: { active: 999, yearly: 999 },
  },
};
