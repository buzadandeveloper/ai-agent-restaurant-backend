import { ApiProperty } from '@nestjs/swagger';

export class RestaurantDto {
  @ApiProperty({ description: 'Restaurant ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Restaurant name', example: 'Delicious Bistro' })
  name: string;

  @ApiProperty({
    description: 'Restaurant description',
    example: 'A cozy family restaurant serving traditional cuisine',
  })
  description: string;

  @ApiProperty({ description: 'Restaurant founder name', example: 'John Doe' })
  founder: string;

  @ApiProperty({ description: 'Restaurant administrator name', example: 'Jane Smith' })
  administrator: string;

  @ApiProperty({ description: 'Number of tables in the restaurant', example: 20 })
  numberOfTables: number;

  @ApiProperty({ description: 'Restaurant phone number', example: '+373 60 123 456' })
  phone: string;

  @ApiProperty({ description: 'Restaurant address', example: '123 Main Street, Chisinau, Moldova' })
  address: string;

  @ApiProperty({ description: 'Unique configuration key for widget integration', example: 'rest_ak7x9m2v4n8p1q3w' })
  configKey: string;

  @ApiProperty({ description: 'ID of the restaurant owner', example: 1 })
  ownerId: number;

  @ApiProperty({ description: 'Restaurant creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Restaurant last update date' })
  updatedAt: Date;
}
