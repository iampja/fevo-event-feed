export interface ExamplePrompt {
  prompt: string;
  label: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    prompt: 'D-backs vs. Giants group offer at Chase Field, $50 GA tickets',
    label: 'Arizona Diamondbacks — group ticket offer',
  },
  {
    prompt: 'Arizona Cardinals game day at State Farm Stadium, $75 GA and $150 VIP',
    label: 'Arizona Cardinals — multi-tier pricing',
  },
  {
    prompt: 'Palisades Tahoe weekend event, $30 adults, $15 kids',
    label: 'Heards Music & Entertainment — family pricing',
  },
  {
    prompt: 'Akron RubberDucks game at Canal Park, $20 GA, 500 capacity',
    label: 'Minor League Baseball — simple group offer',
  },
];
