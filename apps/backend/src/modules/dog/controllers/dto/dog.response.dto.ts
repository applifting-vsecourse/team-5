import { Dog } from '@/modules/dog/domain/dog';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  breed!: string | null;

  @ApiProperty()
  color!: number;

  @ApiProperty()
  ownerId!: string;

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
      color: dog.color,
      ownerId: dog.ownerId,
      disciplines: dog.disciplines ?? [],
      createdAt: dog.createdAt,
      updatedAt: dog.updatedAt,
    };
  }
}
