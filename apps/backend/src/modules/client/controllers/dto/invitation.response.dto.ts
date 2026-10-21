import { Invitation } from '@/modules/client/domain/client';
import { ApiProperty } from '@nestjs/swagger';

export class InvitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromDomain(invitation: Invitation): InvitationResponseDto {
    return {
      id: invitation.id,
      code: invitation.code,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
