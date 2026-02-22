import { ApiProperty } from '@nestjs/swagger';

export class TableResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ example: true, description: 'Whether the table has orders' })
  isOccupied: boolean;

  @ApiProperty({ example: 2, description: 'Total number of orders at this table' })
  activeOrdersCount: number;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}

export class RestaurantTablesResponseDto {
  @ApiProperty({ example: 'The Italian Corner', description: 'Restaurant name' })
  restaurantName: string;

  @ApiProperty({ type: [TableResponseDto], description: 'List of all restaurant tables' })
  tables: TableResponseDto[];
}

export class TableMenuItemResponseDto {
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

export class TableOrderItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  menuItemId: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 12.99 })
  price: number;

  @ApiProperty({ type: () => TableMenuItemResponseDto })
  menuItem: TableMenuItemResponseDto;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T10:30:00.000Z' })
  updatedAt: Date;
}

export class TableOrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tableId: number;

  @ApiProperty({ example: 25.98 })
  total: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ type: [TableOrderItemResponseDto] })
  items: TableOrderItemResponseDto[];

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

  @ApiProperty({ type: [TableOrderResponseDto], description: 'All orders for this table' })
  orders: TableOrderResponseDto[];

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:00:00.000Z' })
  updatedAt: Date;
}
