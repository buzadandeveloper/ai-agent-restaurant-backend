import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { RestaurantTablesResponseDto, TableWithOrdersResponseDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Tables')
@ApiBearerAuth()
@Controller('/api/tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('restaurant/:restaurantId')
  @ApiOperation({
    summary: 'Get all restaurant tables with occupancy status',
    description:
      "Returns restaurant name and all tables with their occupancy status (isOccupied and activeOrdersCount). If tables don't exist, they are auto-generated based on numberOfTables. Used by staff/admin to see table overview.",
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Restaurant tables with occupancy status returned successfully',
    type: RestaurantTablesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getTablesByRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.tablesService.getTablesByRestaurant(restaurantId);
  }

  @Get('restaurant/:restaurantId/:tableId')
  @ApiOperation({
    summary: 'Get specific table details with all orders',
    description:
      'Returns all information about a table including all its orders. Used by staff/admin to see detailed table information.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiResponse({ status: 200, description: 'Table details returned successfully', type: TableWithOrdersResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Restaurant or table not found' })
  async getTableById(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ) {
    return this.tablesService.getTableById(restaurantId, tableId);
  }
}
