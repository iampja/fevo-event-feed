export interface ExamplePrompt {
  prompt: string;
  label: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    prompt: 'Music Fest group offer at Palisades Tahoe, $30 adults, $15 kids',
    label: 'Heards Music & Entertainment — family pricing',
  },
  {
    prompt: 'Palisades Tahoe weekend event, $50 GA and $100 VIP',
    label: 'Heards Music & Entertainment — multi-tier pricing',
  },
  {
    prompt: 'Music festival group tickets, $25 GA, 500 capacity',
    label: 'Heards Music & Entertainment — group offer',
  },
  {
    prompt: 'Concert series at Palisades Tahoe, $40 per ticket, 4 events',
    label: 'Heards Music & Entertainment — event series',
  },
];
