import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

// Single place that decides who may work with a dog's goals, plans and
// records (#85). Today that is only the owner; when sharing with a trainer
// lands (#58, #60) the trainer rule goes here, not into each service.
// A dog the user may not see is reported as missing, never as forbidden,
// so the API does not reveal that it exists.
@Injectable()
export class DogAccessService {
  constructor(private readonly dogRepository: DogRepository) {}

  async getAccessibleDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogById(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return dog;
  }
}
