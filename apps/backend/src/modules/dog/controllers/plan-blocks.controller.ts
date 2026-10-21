import {
  CreatePlanBlockDto,
  PlanBlockResponseDto,
} from '@/modules/dog/controllers/dto/plan-block.dto';
import { PlanBlocksService } from '@/modules/dog/services/plan-blocks.service';
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
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('plan blocks')
@Controller('goals/:goalId/blocks')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PlanBlocksController {
  constructor(private readonly planBlocksService: PlanBlocksService) {}

  @Get()
  @ApiOperation({ summary: "List the blocks of a goal's plan in order" })
  @ApiResponse({ status: 200, type: [PlanBlockResponseDto] })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async list(
    @User() user: Identity,
    @Param('goalId') goalId: string,
  ): Promise<PlanBlockResponseDto[]> {
    const blocks = await this.planBlocksService.getBlocks(user, goalId);
    return blocks.map((block) => PlanBlockResponseDto.fromDomain(block));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add an exercise to the end of a goal's plan" })
  @ApiResponse({ status: 201, type: PlanBlockResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid block data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async create(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: CreatePlanBlockDto,
  ): Promise<PlanBlockResponseDto> {
    const block = await this.planBlocksService.createBlock(user, goalId, body);
    return PlanBlockResponseDto.fromDomain(block);
  }
}
