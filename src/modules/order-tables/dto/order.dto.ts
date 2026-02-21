import { IsInt, IsPositive, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ===== RESPONSE DTOs =====

export class MenuItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Margherita Pizza' })
  name: string;

  @ApiProperty({ example: 'Classic pizza with tomato and mozzarella' })
  description: string;

  @ApiProperty({ example: 12.99 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;
}

export class OrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  menuItemId: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 12.99 })
  price: number;

  @ApiProperty({ type: () => MenuItemResponseDto })
  menuItem: MenuItemResponseDto;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  updatedAt: Date;
}

export class RestaurantBasicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'The Italian Corner' })
  name: string;

  @ApiProperty({ example: '123 Main Street, New York' })
  address: string;

  @ApiProperty({ example: 15 })
  numberOfTables: number;
}

export class TableResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tableId: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 25.98 })
  total: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ type: () => TableResponseDto })
  table: TableResponseDto;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  updatedAt: Date;
}

export class TableWithOrdersResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ type: () => RestaurantBasicResponseDto })
  restaurant: RestaurantBasicResponseDto;

  @ApiProperty({ type: [OrderResponseDto], description: 'All orders for this table (active and historical)' })
  orders: OrderResponseDto[];

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}

export class TableWithActiveOrdersResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ type: [OrderResponseDto], description: 'Active orders only (not completed or cancelled)' })
  orders: OrderResponseDto[];

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}

export class TableWithRestaurantResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ type: () => RestaurantBasicResponseDto })
  restaurant: RestaurantBasicResponseDto;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}

// ===== INPUT DTOs =====

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Menu item ID', example: 1 })
  @IsInt()
  @IsPositive()
  menuItemId: number;

  @ApiProperty({ description: 'Quantity ordered', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'List of ordered items',
    type: [CreateOrderItemDto],
    example: [
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 3, quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class AddItemsToOrderDto {
  @ApiProperty({
    description: 'List of items to add to the order',
    type: [CreateOrderItemDto],
    example: [{ menuItemId: 5, quantity: 1 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
