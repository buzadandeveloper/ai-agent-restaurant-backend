import { IsInt, IsPositive, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
