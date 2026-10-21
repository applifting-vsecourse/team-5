import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
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

describe('DogAccessService', () => {
  const owner = { id: 'u1' } as Identity;

  it('returns the dog to its owner', async () => {
    const dog = aDog();
    const repository = mock<DogRepository>();
    repository.getDogById.mockResolvedValue(dog);

    const service = new DogAccessService(repository);

    await expect(service.getAccessibleDog(owner, 'd1')).resolves.toEqual(dog);
    expect(repository.getDogById).toHaveBeenCalledWith('d1', 'u1');
  });

  it("reports another user's dog as not found", async () => {
    const repository = mock<DogRepository>();
    // The repository filters by owner, so a foreign dog comes back as null.
    repository.getDogById.mockResolvedValue(null);

    const service = new DogAccessService(repository);
    const stranger = { id: 'u2' } as Identity;

    await expect(service.getAccessibleDog(stranger, 'd1')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.getDogById).toHaveBeenCalledWith('d1', 'u2');
  });
});
