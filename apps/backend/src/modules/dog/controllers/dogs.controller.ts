import { DogsService } from '@/modules/dog/services/dogs.service';
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

  @Get()
  @ApiOperation({ summary: 'List all dogs of authenticated user' })
  @ApiResponse({ status: 200, type: [DogResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async list(@User() user: Identity): Promise<DogResponseDto[]> {
    const dogs = await this.dogsService.getDogs(user);
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
}
