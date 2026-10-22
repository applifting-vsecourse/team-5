import { Dog } from '@/modules/dog/domain/dog';
import { DogRepository } from '@/modules/dog/repositories/dog.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Single place that decides who may work with a dog's goals, plans and
// records (#85). The rules live here, not in each service:
//
//                                   owner   trainer with a share   anyone else
//   read the dog                      ✓             ✓                  404
//   goals, plan blocks, trainings     ✓             ✓ (read + edit)    404
//   read the activity records         ✓             ✓                  404
//   edit the dog, log a workout,
//   private notes (#70)               ✓             403                404
//
// A dog the user may not see is reported as missing, never as forbidden, so
// the API does not reveal that it exists. A trainer who can see the dog but
// may not do something gets 403: they already know the dog is there.
//
// Access is read from the dog's share rows on every request, so when a share
// is removed (ending the collaboration, #61) the trainer loses access at once.
@Injectable()
export class DogAccessService {
  constructor(private readonly dogRepository: DogRepository) {}

  // The owner, or a trainer the owner shares the dog with.
  async getAccessibleDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.dogRepository.getDogByIdWithAccess(dogId, user.id);
    if (!dog) {
      throw new NotFoundException(`Dog with ID ${dogId} not found`);
    }
    return dog;
  }

  // Only the owner: the dog's profile, workout records and private notes.
  async getOwnedDog(user: Identity, dogId: string): Promise<Dog> {
    const dog = await this.getAccessibleDog(user, dogId);
    if (dog.ownerId !== user.id) {
      throw new ForbiddenException('Only the owner of the dog can do this');
    }
    return dog;
  }
}
