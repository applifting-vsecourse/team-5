import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DogsService {
  constructor(
    private readonly dogRepository: DogRepository,
    private readonly dogAccess: DogAccessService,
  ) {}

  // The user's own dogs. A trainer reaches the dogs shared with them through
  // their clients (#81), not through this list.
  async getDogs(user: Identity): Promise<Dog[]> {
    return this.dogRepository.getDogsByOwnerId(user.id);
  }

  // The owner, or a trainer the dog is shared with (#85).
  async getDogById(user: Identity, id: string): Promise<Dog> {
    return this.dogAccess.getAccessibleDog(user, id);
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
    // Only the owner edits the profile: a trainer with a share gets 403, anyone
    // else 404. The repository filters on the owner again, so the update itself
    // can never touch someone else's dog.
    await this.dogAccess.getOwnedDog(user, id);
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
