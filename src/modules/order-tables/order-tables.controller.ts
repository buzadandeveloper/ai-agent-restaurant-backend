import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrderTablesService } from './order-tables.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AddItemsToOrderDto,
  TableWithActiveOrdersResponseDto,
  TableWithOrdersResponseDto,
  OrderResponseDto,
} from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Order Tables')
@ApiBearerAuth()
@Controller('/api/order-tables')
@UseGuards(JwtAuthGuard)
export class OrderTablesController {
  constructor(private readonly orderTablesService: OrderTablesService) {}

  // ===== TABLES ENDPOINTS =====

  @Get('restaurant/:restaurantId/tables')
  @ApiOperation({
    summary: 'Get all restaurant tables',
    description:
      "Returns all tables of a restaurant with active orders. If tables don't exist, they are auto-generated based on numberOfTables.",
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tables list returned successfully',
    type: [TableWithActiveOrdersResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getTablesByRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.orderTablesService.getTablesByRestaurant(restaurantId);
  }

  @Get('restaurant/:restaurantId/table/:tableId')
  @ApiOperation({
    summary: 'Get specific table details',
    description: 'Returns all information about a table including all its orders (active and historical)',
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
    return this.orderTablesService.getTableById(restaurantId, tableId);
  }

  // ===== ORDERS ENDPOINTS =====

  @Post('restaurant/:restaurantId/table/:tableId/order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new order at a table',
    description:
      'Creates a new order for a specified table. Client must be at the table. Validates restaurant and table context.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data - unavailable menu items or items from different restaurant' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Restaurant or table not found' })
  async createOrder(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderTablesService.createOrder(restaurantId, tableId, createOrderDto);
  }

  @Get('restaurant/:restaurantId/table/:tableId/order/:orderId')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Returns all details of an order. Validates order belongs to specified restaurant and table.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Order details returned successfully', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to this restaurant/table' })
  async getOrderById(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.orderTablesService.getOrderById(restaurantId, tableId, orderId);
  }

  @Patch('restaurant/:restaurantId/table/:tableId/order/:orderId')
  @ApiOperation({
    summary: 'Add items to an existing order',
    description:
      'Allows adding new items to an order that is not completed or cancelled. Order total is automatically updated. Client must be at the same table.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Items added successfully', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Cannot add items to completed/cancelled orders or items from different restaurant',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to this restaurant/table' })
  async addItemsToOrder(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: AddItemsToOrderDto,
  ) {
    return this.orderTablesService.addItemsToOrder(restaurantId, tableId, orderId, dto.items);
  }

  @Patch('restaurant/:restaurantId/table/:tableId/order/:orderId/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Changes the status of an order (PENDING, PREPARING, READY, SERVED, COMPLETED, CANCELLED). Typically used by restaurant staff.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to this restaurant/table' })
  async updateOrderStatus(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderTablesService.updateOrderStatus(restaurantId, tableId, orderId, dto);
  }

  @Delete('restaurant/:restaurantId/table/:tableId/order/:orderId')
  @ApiOperation({
    summary: 'Cancel an order',
    description: 'Marks an order as cancelled (CANCELLED). Client or restaurant staff can cancel.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to this restaurant/table' })
  async cancelOrder(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.orderTablesService.cancelOrder(restaurantId, tableId, orderId);
  }
}
