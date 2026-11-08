import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyInvitationResponseDto {
  @ApiProperty()
  valid!: boolean;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  trainerName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null;

  @ApiProperty({
    description: 'Whether an account with this email already exists',
  })
  isExistingUser!: boolean;
}
