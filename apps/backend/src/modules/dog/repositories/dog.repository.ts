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

  async getDogByIdWithAccess(id: string, userId: string): Promise<Dog | null> {
    const dog = await this.prisma.dog.findFirst({
      where: {
        id,
        isArchived: false,
        OR: [{ ownerId: userId }, { shares: { some: { trainerId: userId } } }],
      },
    });
    return dog ? mapPrismaDogToDomain(dog) : null;
  }

  async createDog(createDogData: {
    name: string;
    breed?: string | null;
    color: number;
    ownerId: string;
    disciplines?: string[];
  }): Promise<Dog> {
    const dog = await this.prisma.dog.create({
      data: {
        name: createDogData.name,
        breed: createDogData.breed ?? null,
        color: createDogData.color,
        disciplines: createDogData.disciplines ?? [],
        owner: { connect: { id: createDogData.ownerId } },
      },
    });
    return mapPrismaDogToDomain(dog);
  }

  async updateDog(
    id: string,
    ownerId: string,
    updateData: {
      name?: string;
      breed?: string | null;
      color?: number;
      disciplines?: string[];
    },
  ): Promise<Dog | null> {
    const existing = await this.prisma.dog.findFirst({
      where: { id, ownerId, isArchived: false },
    });
    if (!existing) return null;

    const dog = await this.prisma.dog.update({
      where: { id },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.breed !== undefined && { breed: updateData.breed }),
        ...(updateData.color !== undefined && { color: updateData.color }),
        ...(updateData.disciplines !== undefined && {
          disciplines: updateData.disciplines,
        }),
      },
    });
    return mapPrismaDogToDomain(dog);
  }
}
