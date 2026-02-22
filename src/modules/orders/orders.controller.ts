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
import { OrdersService } from './orders.service';
import { CreateOrderDto, AddItemsToOrderDto, OrderResponseDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('/api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('restaurant/:restaurantId/table/:tableId')
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
    return this.ordersService.createOrder(restaurantId, tableId, createOrderDto);
  }

  @Get('restaurant/:restaurantId/table/:tableId/:orderId')
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
    return this.ordersService.getOrderById(restaurantId, tableId, orderId);
  }

  @Patch('restaurant/:restaurantId/table/:tableId/:orderId')
  @ApiOperation({
    summary: 'Add items to an existing order',
    description:
      'Allows adding new items to an order. Order total is automatically updated. Client must be at the same table.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', type: Number })
  @ApiParam({ name: 'tableId', description: 'Table ID', type: Number })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Items added successfully', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid items or items from different restaurant',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found or does not belong to this restaurant/table' })
  async addItemsToOrder(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: AddItemsToOrderDto,
  ) {
    return this.ordersService.addItemsToOrder(restaurantId, tableId, orderId, dto.items);
  }

  @Delete('restaurant/:restaurantId/table/:tableId/:orderId')
  @ApiOperation({
    summary: 'Cancel an order',
    description: 'Deletes an order. Client or restaurant staff can cancel.',
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
    return this.ordersService.cancelOrder(restaurantId, tableId, orderId);
  }
}
