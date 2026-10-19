import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { DogsService } from './dogs.service';

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'd1',
  name: 'Rex',
  breed: 'Border kolie',
  color: 1,
  ownerId: 'u1',
  isArchived: false,
  disciplines: [],
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

describe('DogsService', () => {
  it('returns dogs from the repository for the given user', async () => {
    const dogs = [aDog()];
    const repository = mock<DogRepository>();
    repository.getDogsByOwnerId.mockResolvedValue(dogs);

    const service = new DogsService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogs(user)).resolves.toEqual(dogs);
    expect(repository.getDogsByOwnerId).toHaveBeenCalledWith('u1');
  });

  it('creates a dog owned by the signed-in user', async () => {
    const created = aDog({ id: 'd2', name: 'Alík', breed: 'Kolie', color: 2 });
    const repository = mock<DogRepository>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createDog(user, {
        name: '  Alík  ',
        breed: '  Kolie  ',
        color: 2,
      }),
    ).resolves.toEqual(created);

    expect(repository.createDog).toHaveBeenCalledWith({
      name: 'Alík',
      breed: 'Kolie',
      color: 2,
      ownerId: 'u1',
    });
  });

  it('creates a dog without a breed if not provided', async () => {
    const created = aDog({ id: 'd3', name: 'Baryk', breed: null, color: 3 });
    const repository = mock<DogRepository>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createDog(user, { name: 'Baryk', color: 3 }),
    ).resolves.toEqual(created);

    expect(repository.createDog).toHaveBeenCalledWith({
      name: 'Baryk',
      breed: null,
      color: 3,
      ownerId: 'u1',
    });
  });

  it('returns a dog by ID when it belongs to user', async () => {
    const dog = aDog({ id: 'd1' });
    const repository = mock<DogRepository>();
    repository.getDogById.mockResolvedValue(dog);

    const service = new DogsService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'd1')).resolves.toEqual(dog);
    expect(repository.getDogById).toHaveBeenCalledWith('d1', 'u1');
  });

  it('throws NotFoundException when dog by ID is not found', async () => {
    const repository = mock<DogRepository>();
    repository.getDogById.mockResolvedValue(null);

    const service = new DogsService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
