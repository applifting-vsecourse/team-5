import { Dog } from '@/modules/dog/domain/dog';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DogResponseDto {
  @ApiPropertyOptional({ nullable: true, format: 'date' })
  birthDate?: string | null;
  @ApiPropertyOptional({ nullable: true })
  weightKg?: number | null;
  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
    },
  })
  trainers?: { id: string; name: string }[];

  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  breed!: string | null;

  @ApiProperty()
  color!: number;

  @ApiPropertyOptional({ nullable: true })
  photoUrl!: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty({ type: [String] })
  disciplines!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromDomain(dog: Dog): DogResponseDto {
    return {
      id: dog.id,
      name: dog.name,
      breed: dog.breed ?? null,
      birthDate: dog.birthDate ?? null,
      weightKg: dog.weightKg ?? null,
      trainers: dog.trainers ?? [],
      color: dog.color,
      photoUrl: dog.photoUrl ?? null,
      ownerId: dog.ownerId,
      isArchived: dog.isArchived,
      disciplines: dog.disciplines ?? [],
      createdAt: dog.createdAt,
      updatedAt: dog.updatedAt,
    };
  }
}
