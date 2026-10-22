import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    example: 'klient@example.com',
    description: 'E-mailová adresa klienta',
  })
  @IsNotEmpty({ message: 'E-mail je povinný.' })
  @IsEmail({}, { message: 'Zadejte platnou e-mailovou adresu.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

