import { FeeStructure } from '@/types';

export const feeStructure: Record<string, FeeStructure> = {
  free:       { percent: 5,  flat: 0.99 },
  pro:        { percent: 3,  flat: 0.50 },
  enterprise: { percent: 2,  flat: 0.30 },
};
