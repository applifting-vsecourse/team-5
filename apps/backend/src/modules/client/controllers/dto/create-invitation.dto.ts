import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    example: 'klient@example.com',
    description: 'E-mailová adresa klienta (volitelná)',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Zadejte platnou e-mailovou adresu.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim()
      ? value.trim().toLowerCase()
      : undefined,
  )
  email?: string;
}
