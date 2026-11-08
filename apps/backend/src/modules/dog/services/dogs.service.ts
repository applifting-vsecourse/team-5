import 'multer';
import { todayInAppZone } from '@/modules/dog/domain/calendar-date';
import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogPhotoService } from './dog-photo.service';

export function sanitizeDisciplines(
  disciplines?: unknown,
): string[] | undefined {
  if (!disciplines || !Array.isArray(disciplines)) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of disciplines) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
  }
  return result;
}

@Injectable()
export class DogsService {
  constructor(
    private readonly dogRepository: DogRepository,
    private readonly dogAccess: DogAccessService,
    private readonly dogPhotoService?: DogPhotoService,
  ) {}

  // The user's own dogs. A trainer reaches the dogs shared with them through
  // their clients (#81), not through this list. Archived dogs are listed only
  // when asked for (#57).
  async getDogs(
    user: Identity,
    options: { archived?: boolean } = {},
  ): Promise<Dog[]> {
    return this.dogRepository.getDogsByOwnerId(user.id, options);
  }

  // The owner, or a trainer the dog is shared with (#85).
  async getDogById(user: Identity, id: string): Promise<Dog> {
    return this.dogAccess.getAccessibleDog(user, id);
  }

  // Callers: DogsController POST :id/archive|restore. Existing DogsService.
  // Dog.isArchived soft flag. User asked to split PRs and re-review.
  async archiveDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogAccess.getOwnedDog(user, dogId);
    if (dog.isArchived) {
      throw new BadRequestException('Pes už je v archivu');
    }
    const archived = await this.dogRepository.setArchived(dogId, user.id, true);
    if (!archived) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return archived;
  }

  async restoreDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogAccess.getOwnedDog(user, dogId);
    if (!dog.isArchived) {
      throw new BadRequestException('Pes není v archivu');
    }
    const restored = await this.dogRepository.setArchived(
      dogId,
      user.id,
      false,
    );
    if (!restored) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return restored;
  }

  async createDog(
    user: Identity,
    dogData: {
      name: string;
      breed?: string;
      birthDate?: string;
      weightKg?: number | null;
      color: number;
      disciplines?: string[];
    },
  ): Promise<Dog> {
    if (user.role === 'trainer' || user.role === 'admin') {
      throw new ForbiddenException(
        'Trainers cannot create their own dogs yet.',
      );
    }
    if (dogData.birthDate && dogData.birthDate > todayInAppZone())
      throw new BadRequestException('Datum narození nesmí být v budoucnosti.');
    const sanitizedDisciplines = dogData.disciplines
      ? (sanitizeDisciplines(dogData.disciplines) ?? [])
      : [];

    return this.dogRepository.createDog({
      name: dogData.name.trim(),
      breed: dogData.breed?.trim() || null,
      ...(dogData.birthDate !== undefined && {
        birthDate: dogData.birthDate || null,
      }),
      ...(dogData.weightKg !== undefined && { weightKg: dogData.weightKg }),
      color: dogData.color,
      ownerId: user.id,
      disciplines: sanitizedDisciplines,
    });
  }

  async updateDog(
    user: Identity,
    id: string,
    updateData: {
      name?: string;
      breed?: string;
      birthDate?: string;
      weightKg?: number | null;
      color?: number;
      disciplines?: string[];
    },
  ): Promise<Dog> {
    // Only the owner edits the profile: a trainer with a share gets 403, anyone
    // else 404. The repository filters on the owner again, so the update itself
    // can never touch someone else's dog.
    await this.dogAccess.getOwnedDog(user, id);

    if (updateData.birthDate && updateData.birthDate > todayInAppZone())
      throw new BadRequestException('Datum narození nesmí být v budoucnosti.');
    const sanitizedDisciplines =
      updateData.disciplines !== undefined
        ? sanitizeDisciplines(updateData.disciplines)
        : undefined;

    const updated = await this.dogRepository.updateDog(id, user.id, {
      birthDate:
        updateData.birthDate === undefined
          ? undefined
          : updateData.birthDate || null,
      weightKg: updateData.weightKg,
      name: updateData.name?.trim(),
      breed:
        updateData.breed !== undefined
          ? updateData.breed.trim() || null
          : undefined,
      color: updateData.color,
      disciplines: sanitizedDisciplines,
    });
    if (!updated) {
      throw new NotFoundException(`Dog with ID ${id} not found`);
    }
    return updated;
  }

  async uploadPhoto(
    user: Identity,
    dogId: string,
    file: Express.Multer.File,
  ): Promise<Dog> {
    if (!file) {
      throw new BadRequestException('Soubor nebyl nahrán');
    }

    if (!this.dogPhotoService) {
      throw new Error('DogPhotoService not configured');
    }

    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    const oldPhotoUrl = dog.photoUrl;

    const photoUrl = await this.dogPhotoService.processAndSavePhoto(
      dogId,
      file,
    );

    let updated: Dog | null;
    try {
      updated = await this.dogRepository.updatePhoto(dogId, user.id, photoUrl);
    } catch (err) {
      await this.dogPhotoService.deletePhotoFile(photoUrl);
      throw err;
    }

    if (!updated) {
      await this.dogPhotoService.deletePhotoFile(photoUrl);
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    if (oldPhotoUrl) {
      await this.dogPhotoService.deletePhotoFile(oldPhotoUrl);
    }

    return updated;
  }

  async deletePhoto(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    if (dog.photoUrl && this.dogPhotoService) {
      await this.dogPhotoService.deletePhotoFile(dog.photoUrl);
    }

    const updated = await this.dogRepository.updatePhoto(dogId, user.id, null);
    if (!updated) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return updated;
  }

  async deleteDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    if (dog.photoUrl && this.dogPhotoService) {
      await this.dogPhotoService.deletePhotoFile(dog.photoUrl);
    }

    const deleted = await this.dogRepository.deleteDog(dogId, user.id);
    if (!deleted) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return deleted;
  }
}
