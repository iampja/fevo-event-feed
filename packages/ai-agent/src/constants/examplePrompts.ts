export interface ExamplePrompt {
  prompt: string;
  label: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    prompt: 'Event at Highland Heights Community Center, $10 adults, $5 kids on July 4th',
    label: 'Ticket event with Adult/Child pricing + location',
  },
  {
    prompt: 'Free community meetup registration at Central Park, 100 people',
    label: 'Free registration event (no payment required)',
  },
  {
    prompt: 'Weekly yoga classes every Tuesday at Zen Studio, $20 per class',
    label: 'Recurring event series (may require Pro for unlimited)',
  },
  {
    prompt: 'Concert at The Fillmore on July 15, $50 GA and $120 VIP, 500 capacity',
    label: 'Multi-tier ticketing with venue and capacity',
  },
];
