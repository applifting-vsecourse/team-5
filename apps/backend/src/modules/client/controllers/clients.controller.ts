import { ClientResponseDto } from '@/modules/client/controllers/dto/client.response.dto';
import { InvitationResponseDto } from '@/modules/client/controllers/dto/invitation.response.dto';
import { ClientsService } from '@/modules/client/services/clients.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('clients')
@Controller('clients')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients of authenticated trainer' })
  @ApiResponse({ status: 200, type: [ClientResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async listClients(@User() user: Identity): Promise<ClientResponseDto[]> {
    const clients = await this.clientsService.getClients(user);
    return clients.map(ClientResponseDto.fromDomain);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List unused invitations of authenticated trainer' })
  @ApiResponse({ status: 200, type: [InvitationResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async listInvitations(
    @User() user: Identity,
  ): Promise<InvitationResponseDto[]> {
    const invitations = await this.clientsService.getInvitations(user);
    return invitations.map(InvitationResponseDto.fromDomain);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel an unused invitation' })
  @ApiResponse({ status: 204, description: 'Invitation canceled' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancelInvitation(
    @Param('id') id: string,
    @User() user: Identity,
  ): Promise<void> {
    await this.clientsService.cancelInvitation(id, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a client and their shared dogs' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(
    @Param('id') id: string,
    @User() user: Identity,
  ): Promise<ClientResponseDto> {
    const client = await this.clientsService.getClientById(id, user);
    return ClientResponseDto.fromDomain(client);
  }
}
