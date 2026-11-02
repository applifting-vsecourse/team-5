import { Invitation } from '@/modules/client/domain/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromDomain(invitation: Invitation): InvitationResponseDto {
    return {
      id: invitation.id,
      code: invitation.code,
      email: invitation.email ?? null,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
