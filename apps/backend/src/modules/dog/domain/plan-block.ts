import { PlanBlock } from '@/generated/prisma/client';

export type { PlanBlock };

export type CreatePlanBlockData = {
  title: string;
  instruction?: string;
  criterion?: string;
};
