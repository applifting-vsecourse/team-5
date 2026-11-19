import {
  CreateTrainerNoteDto,
  TrainerNoteResponseDto,
  UpdateTrainerNoteDto,
} from '@/modules/client/controllers/dto/trainer-note.dto';
import { TrainerNotesService } from '@/modules/client/services/trainer-notes.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('trainer-notes')
@Controller()
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class TrainerNotesController {
  constructor(private readonly notesService: TrainerNotesService) {}

  @Get('clients/:clientId/notes')
  @ApiOperation({
    summary: "List the trainer's private notes for a client or shared dog",
  })
  @ApiQuery({ name: 'dogId', required: false, type: String })
  @ApiResponse({ status: 200, type: [TrainerNoteResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Client or dog not found' })
  async listByClient(
    @User() user: Identity,
    @Param('clientId') clientId: string,
    @Query('dogId') dogId?: string,
  ): Promise<TrainerNoteResponseDto[]> {
    const notes = await this.notesService.getNotesByClient(
      user,
      clientId,
      dogId || undefined,
    );
    return notes.map((note) => TrainerNoteResponseDto.fromDomain(note));
  }

  @Post('clients/:clientId/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a private trainer note for a client or shared dog',
  })
  @ApiResponse({ status: 201, type: TrainerNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid note data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Client or dog not found' })
  async create(
    @User() user: Identity,
    @Param('clientId') clientId: string,
    @Body() body: CreateTrainerNoteDto,
  ): Promise<TrainerNoteResponseDto> {
    const note = await this.notesService.createNote(user, clientId, body);
    return TrainerNoteResponseDto.fromDomain(note);
  }

  @Get('trainer-notes/:noteId')
  @ApiOperation({ summary: 'Get a private trainer note' })
  @ApiResponse({ status: 200, type: TrainerNoteResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async get(
    @User() user: Identity,
    @Param('noteId') noteId: string,
  ): Promise<TrainerNoteResponseDto> {
    const note = await this.notesService.getNote(user, noteId);
    return TrainerNoteResponseDto.fromDomain(note);
  }

  @Patch('trainer-notes/:noteId')
  @ApiOperation({ summary: 'Update or pin/unpin a private trainer note' })
  @ApiResponse({ status: 200, type: TrainerNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid note data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @User() user: Identity,
    @Param('noteId') noteId: string,
    @Body() body: UpdateTrainerNoteDto,
  ): Promise<TrainerNoteResponseDto> {
    const note = await this.notesService.updateNote(user, noteId, body);
    return TrainerNoteResponseDto.fromDomain(note);
  }

  @Delete('trainer-notes/:noteId')
  @ApiOperation({ summary: 'Delete a private trainer note' })
  @ApiResponse({ status: 200, type: TrainerNoteResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async delete(
    @User() user: Identity,
    @Param('noteId') noteId: string,
  ): Promise<TrainerNoteResponseDto> {
    const note = await this.notesService.deleteNote(user, noteId);
    return TrainerNoteResponseDto.fromDomain(note);
  }
}
