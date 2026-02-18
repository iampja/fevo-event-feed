export type DateValue = string | { utc: string | null; timezone: string | null; display: string | null };

export type Offer = {
  offer_id: string;
  title: string;
  description: string;
  image_url: string;
  price: { min: number; max: number; currency: string };
  date: DateValue;
  venue: { name: string; city: string; state: string };
  availability: 'available' | 'limited' | 'sold_out';
  organization: { id: string; name: string; logo_url?: string | null };
  checkout_url: string;
  tags: string[];
  media?: { image_url: string | null; video_url: string | null };
  source?: string;
  created_at: string;
  updated_at: string;
};

export type FeedResponse = {
  data: Offer[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
  feed_updated_at: string;
};

export type WidgetConfig = {
  segment?: string;
  theme?: 'light' | 'dark';
  columns?: 1 | 2 | 3 | 4;
  maxCards?: number;
  apiUrl?: string;
  apiKey?: string;
  partnerId?: string;
};

export type WidgetState = 'loading' | 'ready' | 'empty' | 'error';

export type AnalyticsEvent = {
  type:
    | 'widget_loaded'
    | 'offer_card_viewed'
    | 'offer_card_clicked'
    | 'widget_error'
    | 'widget_refreshed'
    | 'offer_detail_opened';
  data: Record<string, unknown>;
};
