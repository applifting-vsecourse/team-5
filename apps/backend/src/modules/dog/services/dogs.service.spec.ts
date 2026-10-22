import 'multer';
import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { DogPhotoService } from './dog-photo.service';
import { DogsService } from './dogs.service';

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: 'd1',
  name: 'Rex',
  breed: 'Border kolie',
  color: 1,
  photoUrl: null,
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
    const photoService = mock<DogPhotoService>();
    repository.getDogsByOwnerId.mockResolvedValue(dogs);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogs(user)).resolves.toEqual(dogs);
    expect(repository.getDogsByOwnerId).toHaveBeenCalledWith('u1');
  });

  it('creates a dog owned by the signed-in user', async () => {
    const created = aDog({ id: 'd2', name: 'Alík', breed: 'Kolie', color: 2 });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, photoService);
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

  it('creates a dog with sanitized disciplines', async () => {
    const created = aDog({
      id: 'd2',
      name: 'Alík',
      disciplines: ['Agility', 'Canicross'],
    });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createDog(user, {
        name: 'Alík',
        color: 2,
        disciplines: ['  Agility  ', 'Agility', '', '   ', 'Canicross'],
      }),
    ).resolves.toEqual(created);

    expect(repository.createDog).toHaveBeenCalledWith({
      name: 'Alík',
      breed: null,
      color: 2,
      ownerId: 'u1',
      disciplines: ['Agility', 'Canicross'],
    });
  });

  it('creates a dog with case-insensitively deduplicated disciplines', async () => {
    const created = aDog({
      id: 'd2',
      name: 'Alík',
      disciplines: ['Canicross'],
    });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await service.createDog(user, {
      name: 'Alík',
      color: 2,
      disciplines: ['Canicross', 'canicross', '  CANICROSS  '],
    });

    expect(repository.createDog).toHaveBeenCalledWith(
      expect.objectContaining({
        disciplines: ['Canicross'],
      }),
    );
  });

  it('creates a dog without a breed if not provided', async () => {
    const created = aDog({ id: 'd3', name: 'Baryk', breed: null, color: 3 });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.createDog.mockResolvedValue(created);

    const service = new DogsService(repository, photoService);
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

  it('updates a dog with sanitized disciplines', async () => {
    const updated = aDog({
      disciplines: ['Obedience', 'Flyball'],
    });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.updateDog.mockResolvedValue(updated);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.updateDog(user, 'd1', {
        disciplines: [' Obedience ', 'Obedience', '   ', 'Flyball'],
      }),
    ).resolves.toEqual(updated);

    expect(repository.updateDog).toHaveBeenCalledWith('d1', 'u1', {
      name: undefined,
      breed: undefined,
      color: undefined,
      disciplines: ['Obedience', 'Flyball'],
    });
  });

  it('returns a dog by ID when it belongs to user or is shared with user', async () => {
    const dog = aDog({ id: 'd1' });
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.getDogByIdWithAccess.mockResolvedValue(dog);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'd1')).resolves.toEqual(dog);
    expect(repository.getDogByIdWithAccess).toHaveBeenCalledWith('d1', 'u1');
  });

  it('throws NotFoundException when dog by ID is not found or not accessible', async () => {
    const repository = mock<DogRepository>();
    const photoService = mock<DogPhotoService>();
    repository.getDogByIdWithAccess.mockResolvedValue(null);

    const service = new DogsService(repository, photoService);
    const user = { id: 'u1' } as Identity;

    await expect(service.getDogById(user, 'non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('uploadPhoto', () => {
    it('successfully processes, saves, deletes old photo, and updates DB', async () => {
      const existingDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: '/uploads/dogs/old-photo.webp',
      });
      const updatedDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: '/uploads/dogs/d1-new.webp',
      });

      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();

      repository.getDogById.mockResolvedValue(existingDog);
      photoService.processAndSavePhoto.mockResolvedValue(
        '/uploads/dogs/d1-new.webp',
      );
      repository.updatePhoto.mockResolvedValue(updatedDog);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;
      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        size: 1000,
      } as Express.Multer.File;

      const result = await service.uploadPhoto(user, 'd1', file);

      expect(result).toEqual(updatedDog);
      expect(repository.getDogById).toHaveBeenCalledWith('d1', 'u1');
      expect(photoService.processAndSavePhoto).toHaveBeenCalledWith('d1', file);
      expect(photoService.deletePhotoFile).toHaveBeenCalledWith(
        '/uploads/dogs/old-photo.webp',
      );
      expect(repository.updatePhoto).toHaveBeenCalledWith(
        'd1',
        'u1',
        '/uploads/dogs/d1-new.webp',
      );
    });

    it('throws NotFoundException when dog is not owned by user', async () => {
      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();
      repository.getDogById.mockResolvedValue(null);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;
      const file = {
        buffer: Buffer.from('fake-image'),
      } as Express.Multer.File;

      await expect(service.uploadPhoto(user, 'd99', file)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cleans up newly saved photo file when DB update fails', async () => {
      const existingDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: '/uploads/dogs/old.webp',
      });
      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();

      repository.getDogById.mockResolvedValue(existingDog);
      photoService.processAndSavePhoto.mockResolvedValue(
        '/uploads/dogs/new.webp',
      );
      repository.updatePhoto.mockRejectedValue(new Error('DB failure'));

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;
      const file = { buffer: Buffer.from('img') } as Express.Multer.File;

      await expect(service.uploadPhoto(user, 'd1', file)).rejects.toThrow(
        'DB failure',
      );
      expect(photoService.deletePhotoFile).toHaveBeenCalledWith(
        '/uploads/dogs/new.webp',
      );
      expect(photoService.deletePhotoFile).not.toHaveBeenCalledWith(
        '/uploads/dogs/old.webp',
      );
    });
  });

  describe('deletePhoto', () => {
    it('deletes photo file and sets photoUrl to null in DB', async () => {
      const existingDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: '/uploads/dogs/d1-photo.webp',
      });
      const updatedDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: null,
      });

      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();

      repository.getDogById.mockResolvedValue(existingDog);
      repository.updatePhoto.mockResolvedValue(updatedDog);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;

      const result = await service.deletePhoto(user, 'd1');

      expect(result).toEqual(updatedDog);
      expect(repository.getDogById).toHaveBeenCalledWith('d1', 'u1');
      expect(photoService.deletePhotoFile).toHaveBeenCalledWith(
        '/uploads/dogs/d1-photo.webp',
      );
      expect(repository.updatePhoto).toHaveBeenCalledWith('d1', 'u1', null);
    });

    it('throws NotFoundException when dog is not owned by user', async () => {
      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();
      repository.getDogById.mockResolvedValue(null);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;

      await expect(service.deletePhoto(user, 'd99')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteDog', () => {
    it('deletes photo file and removes dog from repository', async () => {
      const existingDog = aDog({
        id: 'd1',
        ownerId: 'u1',
        photoUrl: '/uploads/dogs/d1-photo.webp',
      });
      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();

      repository.getDogById.mockResolvedValue(existingDog);
      repository.deleteDog.mockResolvedValue(existingDog);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;

      const result = await service.deleteDog(user, 'd1');

      expect(result).toEqual(existingDog);
      expect(photoService.deletePhotoFile).toHaveBeenCalledWith(
        '/uploads/dogs/d1-photo.webp',
      );
      expect(repository.deleteDog).toHaveBeenCalledWith('d1', 'u1');
    });

    it('throws NotFoundException when dog to delete is not found', async () => {
      const repository = mock<DogRepository>();
      const photoService = mock<DogPhotoService>();
      repository.getDogById.mockResolvedValue(null);

      const service = new DogsService(repository, photoService);
      const user = { id: 'u1' } as Identity;

      await expect(service.deleteDog(user, 'd99')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
