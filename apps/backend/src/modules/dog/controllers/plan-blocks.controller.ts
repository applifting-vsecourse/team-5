import {
  CreatePlanBlockDto,
  PlanBlockResponseDto,
  ReorderPlanBlocksDto,
  UpdatePlanBlockDto,
} from '@/modules/dog/controllers/dto/plan-block.dto';
import { PlanBlocksService } from '@/modules/dog/services/plan-blocks.service';
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
  Put,
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
export class PlanBlocksController {
  constructor(private readonly planBlocksService: PlanBlocksService) {}

  @Get('goals/:goalId/blocks')
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

  @Post('goals/:goalId/blocks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Add an exercise to a goal's plan, at the end or at a position",
  })
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

  @Put('goals/:goalId/blocks/order')
  @ApiOperation({ summary: "Change the order of a goal's plan blocks" })
  @ApiResponse({ status: 200, type: [PlanBlockResponseDto] })
  @ApiResponse({
    status: 400,
    description: 'The order does not list every block exactly once',
  })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async reorder(
    @User() user: Identity,
    @Param('goalId') goalId: string,
    @Body() body: ReorderPlanBlocksDto,
  ): Promise<PlanBlockResponseDto[]> {
    const blocks = await this.planBlocksService.reorderBlocks(
      user,
      goalId,
      body.blockIds,
    );
    return blocks.map((block) => PlanBlockResponseDto.fromDomain(block));
  }

  @Patch('blocks/:blockId')
  @ApiOperation({ summary: 'Update a plan block' })
  @ApiResponse({ status: 200, type: PlanBlockResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid block data' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Plan block not found' })
  async update(
    @User() user: Identity,
    @Param('blockId') blockId: string,
    @Body() body: UpdatePlanBlockDto,
  ): Promise<PlanBlockResponseDto> {
    const block = await this.planBlocksService.updateBlock(user, blockId, body);
    return PlanBlockResponseDto.fromDomain(block);
  }

  @Delete('blocks/:blockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plan block' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Plan block not found' })
  async delete(
    @User() user: Identity,
    @Param('blockId') blockId: string,
  ): Promise<void> {
    await this.planBlocksService.deleteBlock(user, blockId);
  }
}
