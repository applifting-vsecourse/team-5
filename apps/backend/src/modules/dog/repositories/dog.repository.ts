import { PrismaService } from '@/core/prisma/prisma.service';
import { Dog as PrismaDog } from '@/generated/prisma/client';
import { Dog } from '@/modules/dog/domain/dog';
import { Injectable } from '@nestjs/common';

const dogRelations = {
  shares: { select: { trainer: { select: { id: true, name: true } } } },
} as const;
const mapPrismaDogToDomain = (
  dog: PrismaDog & { shares?: { trainer: { id: string; name: string } }[] },
): Dog => ({
  id: dog.id,
  name: dog.name,
  breed: dog.breed,
  birthDate: dog.birthDate,
  weightKg: dog.weightKg,
  trainers: dog.shares?.map((share) => share.trainer) ?? [],
  color: dog.color,
  photoUrl: dog.photoUrl,
  ownerId: dog.ownerId,
  isArchived: dog.isArchived,
  disciplines: dog.disciplines,
  createdAt: dog.createdAt,
  updatedAt: dog.updatedAt,
});

@Injectable()
export class DogRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Callers: DogsService.getDogs / archiveDog / restoreDog; DogAccessService.
  // Existing DogRepository (not a new module). Soft-archive via Dog.isArchived.
  // User: "zpracuj stories 57,69 a 87 nad soucasnym dev"
  async getDogsByOwnerId(
    ownerId: string,
    options: { archived?: boolean } = {},
  ): Promise<Dog[]> {
    const dogs = await this.prisma.dog.findMany({
      include: dogRelations,
      where: {
        ownerId,
        isArchived: options.archived ?? false,
      },
      orderBy: { createdAt: 'asc' },
    });
    return dogs.map(mapPrismaDogToDomain);
  }

  async getDogById(id: string, ownerId: string): Promise<Dog | null> {
    const dog = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: {
        id,
        ownerId,
      },
    });
    return dog ? mapPrismaDogToDomain(dog) : null;
  }

  // Owner sees archived dogs (history / restore). Trainer shares only active.
  async getDogByIdWithAccess(id: string, userId: string): Promise<Dog | null> {
    const dog = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            isArchived: false,
            shares: { some: { trainerId: userId } },
          },
        ],
      },
    });
    return dog ? mapPrismaDogToDomain(dog) : null;
  }

  async setArchived(
    id: string,
    ownerId: string,
    isArchived: boolean,
  ): Promise<Dog | null> {
    const existing = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: { id, ownerId, isArchived: !isArchived },
    });
    if (!existing) return null;

    const dog = await this.prisma.dog.update({
      include: dogRelations,
      where: { id },
      data: { isArchived },
    });
    return mapPrismaDogToDomain(dog);
  }

  async createDog(createDogData: {
    name: string;
    breed?: string | null;
    birthDate?: string | null;
    weightKg?: number | null;
    color: number;
    ownerId: string;
    disciplines?: string[];
  }): Promise<Dog> {
    const dog = await this.prisma.dog.create({
      include: dogRelations,
      data: {
        name: createDogData.name,
        breed: createDogData.breed ?? null,
        birthDate: createDogData.birthDate ?? null,
        weightKg: createDogData.weightKg ?? null,
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
      birthDate?: string | null;
      weightKg?: number | null;
      color?: number;
      disciplines?: string[];
    },
  ): Promise<Dog | null> {
    const existing = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: { id, ownerId, isArchived: false },
    });
    if (!existing) return null; // archived dogs are restored before editing

    const dog = await this.prisma.dog.update({
      include: dogRelations,
      where: { id },
      data: {
        ...(updateData.birthDate !== undefined && {
          birthDate: updateData.birthDate,
        }),
        ...(updateData.weightKg !== undefined && {
          weightKg: updateData.weightKg,
        }),
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

  async updatePhoto(
    id: string,
    ownerId: string,
    photoUrl: string | null,
  ): Promise<Dog | null> {
    const existing = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: { id, ownerId, isArchived: false },
    });
    if (!existing) return null;

    const dog = await this.prisma.dog.update({
      include: dogRelations,
      where: { id },
      data: { photoUrl },
    });
    return mapPrismaDogToDomain(dog);
  }

  async deleteDog(id: string, ownerId: string): Promise<Dog | null> {
    const existing = await this.prisma.dog.findFirst({
      include: dogRelations,
      where: { id, ownerId, isArchived: false },
    });
    if (!existing) return null;

    const dog = await this.prisma.dog.delete({
      include: dogRelations,
      where: { id },
    });
    return mapPrismaDogToDomain(dog);
  }
}
