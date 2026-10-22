import 'multer';
import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogPhotoService } from './dog-photo.service';

export function sanitizeDisciplines(
  disciplines?: string[],
): string[] | undefined {
  if (!disciplines || !Array.isArray(disciplines)) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of disciplines) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0 && !seen.has(trimmed)) {
        seen.add(trimmed);
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
    private readonly dogPhotoService: DogPhotoService,
  ) {}

  async getDogs(user: Identity): Promise<Dog[]> {
    return this.dogRepository.getDogsByOwnerId(user.id);
  }

  async getDogById(user: Identity, id: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogByIdWithAccess(id, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${id} not found`);
    }
    return dog;
  }

  async createDog(
    user: Identity,
    dogData: {
      name: string;
      breed?: string;
      color: number;
      disciplines?: string[];
    },
  ): Promise<Dog> {
    const sanitizedDisciplines = dogData.disciplines
      ? (sanitizeDisciplines(dogData.disciplines) ?? [])
      : [];

    return this.dogRepository.createDog({
      name: dogData.name.trim(),
      breed: dogData.breed?.trim() || null,
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
      color?: number;
      disciplines?: string[];
    },
  ): Promise<Dog> {
    const sanitizedDisciplines =
      updateData.disciplines !== undefined
        ? sanitizeDisciplines(updateData.disciplines)
        : undefined;

    const updated = await this.dogRepository.updateDog(id, user.id, {
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

    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    const photoUrl = await this.dogPhotoService.processAndSavePhoto(
      dogId,
      file,
    );

    if (dog.photoUrl) {
      await this.dogPhotoService.deletePhotoFile(dog.photoUrl);
    }

    const updated = await this.dogRepository.updatePhoto(
      dogId,
      user.id,
      photoUrl,
    );
    if (!updated) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return updated;
  }

  async deletePhoto(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }

    if (dog.photoUrl) {
      await this.dogPhotoService.deletePhotoFile(dog.photoUrl);
    }

    const updated = await this.dogRepository.updatePhoto(dogId, user.id, null);
    if (!updated) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return updated;
  }
}
