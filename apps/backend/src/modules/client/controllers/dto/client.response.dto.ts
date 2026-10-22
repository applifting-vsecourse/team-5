import { Client, ClientDog } from '@/modules/client/domain/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientDogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  color!: number;

  @ApiPropertyOptional({ nullable: true })
  breed?: string | null;

  @ApiPropertyOptional({ type: [String] })
  disciplines?: string[];

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string | null;
}

export class ClientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [ClientDogResponseDto] })
  dogs!: ClientDogResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromDomain(client: Client): ClientResponseDto {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      dogs: client.dogs.map((dog: ClientDog) => ({
        id: dog.id,
        name: dog.name,
        color: dog.color,
        breed: dog.breed ?? null,
        disciplines: dog.disciplines ?? [],
        photoUrl: dog.photoUrl ?? null,
      })),
      createdAt: client.createdAt,
    };
  }
}
