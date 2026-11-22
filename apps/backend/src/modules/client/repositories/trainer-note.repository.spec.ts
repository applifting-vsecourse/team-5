import { PrismaService } from '@/core/prisma/prisma.service';
import { TrainerNoteRepository } from '@/modules/client/repositories/trainer-note.repository';
import { mock } from 'jest-mock-extended';

describe('TrainerNoteRepository', () => {
  it('orders notes with pinned first, then newest date, then newest createdAt', async () => {
    const prisma = mock<PrismaService>();
    const trainerNoteDelegate = {
      findMany: jest.fn().mockResolvedValue([]),
    };
    // @ts-expect-error mock delegate
    prisma.trainerNote = trainerNoteDelegate;

    const repository = new TrainerNoteRepository(prisma);
    await repository.getNotesByClient('t1', 'c1');

    expect(trainerNoteDelegate.findMany).toHaveBeenCalledWith({
      where: {
        trainerId: 't1',
        clientId: 'c1',
        OR: [
          { dogId: null },
          {
            dog: {
              isArchived: false,
              shares: { some: { trainerId: 't1' } },
            },
          },
        ],
      },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('scopes dog-filtered queries by trainerId, clientId, and dogId', async () => {
    const prisma = mock<PrismaService>();
    const trainerNoteDelegate = {
      findMany: jest.fn().mockResolvedValue([]),
    };
    // @ts-expect-error mock delegate
    prisma.trainerNote = trainerNoteDelegate;

    const repository = new TrainerNoteRepository(prisma);
    await repository.getNotesByClient('t1', 'c1', 'd1');

    expect(trainerNoteDelegate.findMany).toHaveBeenCalledWith({
      where: {
        trainerId: 't1',
        clientId: 'c1',
        dogId: 'd1',
      },
      include: {
        dog: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }],
    });
  });
});
