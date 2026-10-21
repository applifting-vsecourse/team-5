import { PrismaService } from '@/core/prisma/prisma.service';
import { Dog as PrismaDog } from '@/generated/prisma/client';
import { Dog } from '@/modules/dog/domain/dog';
import { Injectable } from '@nestjs/common';

const mapPrismaDogToDomain = (dog: PrismaDog): Dog => ({
  id: dog.id,
  name: dog.name,
  breed: dog.breed,
  color: dog.color,
  ownerId: dog.ownerId,
  isArchived: dog.isArchived,
  disciplines: dog.disciplines,
  createdAt: dog.createdAt,
  updatedAt: dog.updatedAt,
});

@Injectable()
export class DogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDogsByOwnerId(ownerId: string): Promise<Dog[]> {
    const dogs = await this.prisma.dog.findMany({
      where: {
        ownerId,
        isArchived: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    return dogs.map(mapPrismaDogToDomain);
  }

  async getDogById(id: string, ownerId: string): Promise<Dog | null> {
    const dog = await this.prisma.dog.findFirst({
      where: {
        id,
        ownerId,
        isArchived: false,
      },
    });
    return dog ? mapPrismaDogToDomain(dog) : null;
  }

  async createDog(createDogData: {
    name: string;
    breed?: string | null;
    color: number;
    ownerId: string;
  }): Promise<Dog> {
    const dog = await this.prisma.dog.create({
      data: {
        name: createDogData.name,
        breed: createDogData.breed ?? null,
        color: createDogData.color,
        owner: { connect: { id: createDogData.ownerId } },
      },
    });
    return mapPrismaDogToDomain(dog);
  }
}
