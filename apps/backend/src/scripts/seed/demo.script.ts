import 'dotenv/config';
import { PrismaService } from '@/core/prisma/prisma.service';
import { seedDemoDatabase } from './seed/demo-seed';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  try {
    await seedDemoDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Demo seed failed:', error);
  process.exitCode = 1;
});
