import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

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
}

