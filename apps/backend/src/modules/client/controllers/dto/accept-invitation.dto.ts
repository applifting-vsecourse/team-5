import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    example: 'K7M2PQ',
    description: '6místný kód pozvánky',
  })
  @IsNotEmpty({ message: 'Kód pozvánky je povinný.' })
  @IsString()
  @Length(6, 6, { message: 'Kód pozvánky musí mít přesně 6 znaků.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code!: string;

  @ApiProperty({
    example: ['cuid_dog_1'],
    description:
      'Seznam ID psů ke sdílení s trenérem (alespoň jeden je povinný)',
    type: [String],
  })
  @IsArray({ message: 'Seznam psů musí být pole.' })
  @ArrayNotEmpty({
    message: 'Vyberte alespoň jednoho psa ke sdílení s trenérem.',
  })
  @IsString({ each: true, message: 'Každé ID psa musí být řetězec.' })
  dogIds!: string[];
}
