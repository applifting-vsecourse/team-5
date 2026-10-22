import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DogsService {
  constructor(private readonly dogRepository: DogRepository) {}

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
    return this.dogRepository.createDog({
      name: dogData.name.trim(),
      breed: dogData.breed?.trim() || null,
      color: dogData.color,
      ownerId: user.id,
      disciplines: dogData.disciplines ?? [],
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
    const updated = await this.dogRepository.updateDog(id, user.id, {
      name: updateData.name?.trim(),
      breed:
        updateData.breed !== undefined
          ? updateData.breed.trim() || null
          : undefined,
      color: updateData.color,
      disciplines: updateData.disciplines,
    });
    if (!updated) {
      throw new NotFoundException(`Dog with ID ${id} not found`);
    }
    return updated;
  }
}
