import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

    const service = new DogsService(repository, mock<DogAccessService>());
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogs(user)).resolves.toEqual(dogs);
    expect(repository.getDogsByOwnerId).toHaveBeenCalledWith('u1');
  });

  it('creates a dog owned by the signed-in user', async () => {
    const created = aDog({ id: 'd2', name: 'Alík', breed: 'Kolie', color: 2 });
    const repository = mock<DogRepository>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, mock<DogAccessService>());
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
      disciplines: [],
    });
  });

  it('creates a dog without a breed if not provided', async () => {
    const created = aDog({ id: 'd3', name: 'Baryk', breed: null, color: 3 });
    const repository = mock<DogRepository>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, mock<DogAccessService>());
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createDog(user, { name: 'Baryk', color: 3 }),
    ).resolves.toEqual(created);

    expect(repository.createDog).toHaveBeenCalledWith({
      name: 'Baryk',
      breed: null,
      color: 3,
      ownerId: 'u1',
      disciplines: [],
    });
  });

  it('returns a dog by ID through the access rules (owner or shared trainer)', async () => {
    const dog = aDog({ id: 'd1' });
    const dogAccess = mock<DogAccessService>();
    dogAccess.getAccessibleDog.mockResolvedValue(dog);

    const service = new DogsService(mock<DogRepository>(), dogAccess);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'd1')).resolves.toEqual(dog);
    expect(dogAccess.getAccessibleDog).toHaveBeenCalledWith(user, 'd1');
  });

  it('throws NotFoundException when the dog is not accessible', async () => {
    const dogAccess = mock<DogAccessService>();
    dogAccess.getAccessibleDog.mockRejectedValue(new NotFoundException());

    const service = new DogsService(mock<DogRepository>(), dogAccess);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('updateDog', () => {
    it('lets the owner edit the dog', async () => {
      const updated = aDog({ name: 'Rexík' });
      const repository = mock<DogRepository>();
      repository.updateDog.mockResolvedValue(updated);
      const dogAccess = mock<DogAccessService>();
      dogAccess.getOwnedDog.mockResolvedValue(aDog());

      const service = new DogsService(repository, dogAccess);
      const owner = { id: 'u1' } as Identity;

      await expect(
        service.updateDog(owner, 'd1', { name: ' Rexík ' }),
      ).resolves.toEqual(updated);
      expect(dogAccess.getOwnedDog).toHaveBeenCalledWith(owner, 'd1');
      expect(repository.updateDog).toHaveBeenCalledWith(
        'd1',
        'u1',
        expect.objectContaining({ name: 'Rexík' }),
      );
    });

    it('does not let a trainer with a share edit the dog (403)', async () => {
      const repository = mock<DogRepository>();
      const dogAccess = mock<DogAccessService>();
      dogAccess.getOwnedDog.mockRejectedValue(new ForbiddenException());

      const service = new DogsService(repository, dogAccess);
      const trainer = { id: 'u9' } as Identity;

      await expect(
        service.updateDog(trainer, 'd1', { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.updateDog).not.toHaveBeenCalled();
    });

    it("reports another user's dog as not found (404)", async () => {
      const repository = mock<DogRepository>();
      const dogAccess = mock<DogAccessService>();
      dogAccess.getOwnedDog.mockRejectedValue(new NotFoundException());

      const service = new DogsService(repository, dogAccess);
      const stranger = { id: 'u2' } as Identity;

      await expect(
        service.updateDog(stranger, 'd1', { name: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateDog).not.toHaveBeenCalled();
    });
  });
});
