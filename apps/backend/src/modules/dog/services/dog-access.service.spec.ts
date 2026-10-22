import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { DogAccessService } from './dog-access.service';

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'd1',
  name: 'Rex',
  breed: 'Border kolie',
  color: 1,
  ownerId: 'u1',
  isArchived: false,
  disciplines: ['Poslušnost'],
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

describe('DogAccessService (#85)', () => {
  const owner = { id: 'u1' } as Identity;
  const trainer = { id: 'u9' } as Identity;
  const stranger = { id: 'u2' } as Identity;

  // The repository decides who sees a dog from the owner and the share rows,
  // exactly like in the database: the owner and a trainer with a share get the
  // dog, everyone else gets null.
  const setup = (): {
    service: DogAccessService;
    repository: ReturnType<typeof mock<DogRepository>>;
  } => {
    const repository = mock<DogRepository>();
    repository.getDogByIdWithAccess.mockImplementation((id, userId) =>
      Promise.resolve(
        id === 'd1' && (userId === 'u1' || userId === 'u9') ? aDog() : null,
      ),
    );
    return { service: new DogAccessService(repository), repository };
  };

  describe('getAccessibleDog', () => {
    it('returns the dog to its owner', async () => {
      const { service, repository } = setup();

      await expect(service.getAccessibleDog(owner, 'd1')).resolves.toEqual(
        aDog(),
      );
      expect(repository.getDogByIdWithAccess).toHaveBeenCalledWith('d1', 'u1');
    });

    it('returns the dog to a trainer it is shared with', async () => {
      const { service } = setup();

      await expect(service.getAccessibleDog(trainer, 'd1')).resolves.toEqual(
        aDog(),
      );
    });

    it("reports another user's dog as not found", async () => {
      const { service, repository } = setup();

      await expect(service.getAccessibleDog(stranger, 'd1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.getDogByIdWithAccess).toHaveBeenCalledWith('d1', 'u2');
    });

    it('reports a dog that does not exist the same way (nothing is revealed)', async () => {
      const { service } = setup();

      const missing = await service
        .getAccessibleDog(owner, 'nope')
        .catch((e: Error) => e);
      const foreign = await service
        .getAccessibleDog(stranger, 'd1')
        .catch((e: Error) => e);

      expect(missing).toBeInstanceOf(NotFoundException);
      expect(foreign).toBeInstanceOf(NotFoundException);
    });

    it('loses a trainer the moment the share is gone (#61)', async () => {
      const { service, repository } = setup();
      await expect(
        service.getAccessibleDog(trainer, 'd1'),
      ).resolves.toBeDefined();

      // The collaboration ends: the share row no longer exists.
      repository.getDogByIdWithAccess.mockResolvedValue(null);

      await expect(service.getAccessibleDog(trainer, 'd1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOwnedDog', () => {
    it('returns the dog to its owner', async () => {
      const { service } = setup();

      await expect(service.getOwnedDog(owner, 'd1')).resolves.toEqual(aDog());
    });

    it('refuses a trainer with a share with 403 (they can see the dog)', async () => {
      const { service } = setup();

      await expect(service.getOwnedDog(trainer, 'd1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('reports a dog of someone else as not found, not forbidden', async () => {
      const { service } = setup();

      await expect(service.getOwnedDog(stranger, 'd1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
