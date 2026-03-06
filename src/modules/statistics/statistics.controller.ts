import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { StatisticsService } from './statistics.service';
import { DailyStatsResponseDto } from './dto';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('/api/statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('restaurant/:restaurantId/daily')
  @ApiOperation({
    summary: 'Get daily statistics',
    description: 'Get daily statistics for a date range. Defaults to last 30 days',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiQuery({ name: 'startDate', description: 'Start date (ISO format)', required: false, type: String })
  @ApiQuery({ name: 'endDate', description: 'End date (ISO format)', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: DailyStatsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getDailyStats(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getDailyStats(restaurantId, start, end);
  }
}
