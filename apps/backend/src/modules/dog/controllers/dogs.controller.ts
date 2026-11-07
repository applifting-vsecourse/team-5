import 'multer';
import { DogsService } from '@/modules/dog/services/dogs.service';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateDogDto } from './dto/create-dog.dto';
import { DogResponseDto } from './dto/dog.response.dto';
import { UpdateDogDto } from './dto/update-dog.dto';

@ApiTags('dogs')
@Controller('dogs')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  // Callers: frontend dogsQueryOptions / archive+restore hooks via HTTP.
  // Existing DogsController. Soft archive Dog.isArchived boolean.
  // User: "zpracuj stories 57,69 a 87 nad soucasnym dev"
  @Get()
  @ApiOperation({ summary: 'List dogs of authenticated user' })
  @ApiQuery({
    name: 'archived',
    required: false,
    description: 'When true, list archived dogs (#57)',
  })
  @ApiResponse({ status: 200, type: [DogResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async list(
    @User() user: Identity,
    @Query('archived') archived?: string,
  ): Promise<DogResponseDto[]> {
    const dogs = await this.dogsService.getDogs(user, {
      archived: archived === 'true' || archived === '1',
    });
    return dogs.map(DogResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single dog by ID' })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async get(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.getDogById(user, id);
    return DogResponseDto.fromDomain(dog);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a dog (#57)' })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can archive' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async archive(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.archiveDog(user, id);
    return DogResponseDto.fromDomain(dog);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived dog (#57)' })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Only the owner can restore' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async restore(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.restoreDog(user, id);
    return DogResponseDto.fromDomain(dog);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new dog' })
  @ApiResponse({ status: 201, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async create(
    @User() user: Identity,
    @Body() body: CreateDogDto,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.createDog(user, {
      name: body.name,
      breed: body.breed,
      birthDate: body.birthDate,
      weightKg: body.weightKg,
      color: body.color,
      disciplines: body.disciplines,
    });
    return DogResponseDto.fromDomain(dog);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing dog' })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async update(
    @User() user: Identity,
    @Param('id') id: string,
    @Body() body: UpdateDogDto,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.updateDog(user, id, body);
    return DogResponseDto.fromDomain(dog);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload dog profile photo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid image format or size' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async uploadPhoto(
    @User() user: Identity,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.uploadPhoto(user, id, file);
    return DogResponseDto.fromDomain(dog);
  }

  @Delete(':id/photo')
  @ApiOperation({ summary: 'Delete dog profile photo' })
  @ApiResponse({ status: 200, type: DogResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Dog not found' })
  async deletePhoto(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<DogResponseDto> {
    const dog = await this.dogsService.deletePhoto(user, id);
    return DogResponseDto.fromDomain(dog);
  }
}
