import {
  CreateDogNoteDto,
  DogNoteResponseDto,
  UpdateDogNoteDto,
} from '@/modules/dog/controllers/dto/dog-note.dto';
import { DogNotesService } from '@/modules/dog/services/dog-notes.service';
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

@ApiTags('notes')
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
export class DogNotesController {
  constructor(private readonly notesService: DogNotesService) {}

  @Get('dogs/:dogId/notes')
  @ApiOperation({ summary: "List the owner's private notes for a dog" })
  @ApiResponse({ status: 200, type: [DogNoteResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can read notes' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async listByDog(
    @User() user: Identity,
    @Param('dogId') dogId: string,
  ): Promise<DogNoteResponseDto[]> {
    const notes = await this.notesService.getNotesByDogId(user, dogId);
    return notes.map((note) => DogNoteResponseDto.fromDomain(note));
  }

  @Post('dogs/:dogId/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a private lesson or seminar note' })
  @ApiResponse({ status: 201, type: DogNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid note data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can add notes' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async create(
    @User() user: Identity,
    @Param('dogId') dogId: string,
    @Body() body: CreateDogNoteDto,
  ): Promise<DogNoteResponseDto> {
    const note = await this.notesService.createNote(user, dogId, body);
    return DogNoteResponseDto.fromDomain(note);
  }

  @Get('notes/:noteId')
  @ApiOperation({ summary: 'Get a private dog note' })
  @ApiResponse({ status: 200, type: DogNoteResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can read notes' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async get(
    @User() user: Identity,
    @Param('noteId') noteId: string,
  ): Promise<DogNoteResponseDto> {
    const note = await this.notesService.getNote(user, noteId);
    return DogNoteResponseDto.fromDomain(note);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update a private dog note' })
  @ApiResponse({ status: 200, type: DogNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid note data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can update notes' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @User() user: Identity,
    @Param('noteId') noteId: string,
    @Body() body: UpdateDogNoteDto,
  ): Promise<DogNoteResponseDto> {
    const note = await this.notesService.updateNote(user, noteId, body);
    return DogNoteResponseDto.fromDomain(note);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Delete a private dog note' })
  @ApiResponse({ status: 200, type: DogNoteResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can delete notes' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async delete(
    @User() user: Identity,
    @Param('noteId') noteId: string,
  ): Promise<DogNoteResponseDto> {
    const note = await this.notesService.deleteNote(user, noteId);
    return DogNoteResponseDto.fromDomain(note);
  }
}
