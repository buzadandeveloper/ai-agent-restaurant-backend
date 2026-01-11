import { ApiProperty } from '@nestjs/swagger';

export class MenuItemDto {
  @ApiProperty({ example: 1, description: 'Menu item ID' })
  id: number;

  @ApiProperty({ example: 'Caesar Salad', description: 'Menu item name' })
  name: string;

  @ApiProperty({
    example: 'Fresh lettuce with Caesar dressing',
    description: 'Menu item description'
  })
  description: string;

  @ApiProperty({ example: 12.99, description: 'Menu item price' })
  price: number;

  @ApiProperty({ example: 'MDL', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: true, description: 'Whether the item is available' })
  isAvailable: boolean;

  @ApiProperty({
    example: ['vegetarian', 'healthy'],
    description: 'Menu item tags',
    type: [String]
  })
  tags: string[];

  @ApiProperty({
    example: ['dairy'],
    description: 'Menu item allergens',
    type: [String]
  })
  allergens: string[];

  @ApiProperty({ example: 1, description: 'Category ID' })
  categoryId: number;

  @ApiProperty({ example: 'Appetizers', description: 'Category name' })
  categoryName: string;

  @ApiProperty({
    example: 'Starter dishes',
    description: 'Category description',
    required: false
  })
  categoryDescription?: string;
}
