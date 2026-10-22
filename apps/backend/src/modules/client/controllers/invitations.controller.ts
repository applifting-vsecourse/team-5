import { AcceptInvitationDto } from '@/modules/client/controllers/dto/accept-invitation.dto';
import { VerifyInvitationResponseDto } from '@/modules/client/controllers/dto/verify-invitation.response.dto';
import { ClientsService } from '@/modules/client/services/clients.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class InvitationsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Verify an invitation code' })
  @ApiParam({
    name: 'code',
    description: '6-character invitation code',
    type: String,
  })
  @ApiResponse({ status: 200, type: VerifyInvitationResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invitation expired or already used',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async verifyInvitation(
    @Param('code') code: string,
  ): Promise<VerifyInvitationResponseDto> {
    return this.clientsService.verifyInvitation(code.trim().toUpperCase());
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedUserGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Accept an invitation code and connect to trainer' })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or self-invitation',
  })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(
    @User() user: Identity,
    @Body() dto: AcceptInvitationDto,
  ): Promise<{ success: boolean }> {
    await this.clientsService.acceptInvitation(dto.code, user);
    return { success: true };
  }
}
