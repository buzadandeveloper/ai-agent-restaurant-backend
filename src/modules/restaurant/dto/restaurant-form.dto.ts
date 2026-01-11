import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RestaurantFormDto {
  @ApiProperty({ description: 'Restaurant name', example: 'Delicious Bistro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Restaurant description',
    example: 'A cozy family restaurant serving traditional cuisine',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Restaurant founder name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  founder: string;

  @ApiProperty({ description: 'Restaurant administrator name', example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  administrator: string;

  @ApiProperty({ description: 'Number of tables in the restaurant', example: 20 })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  numberOfTables: number;

  @ApiProperty({ description: 'Restaurant phone number', example: '+373 60 123 456' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Restaurant address', example: '123 Main Street, Chisinau, Moldova' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Optional CSV file containing menu items',
    type: 'string',
    format: 'binary',
    required: false,
    example: 'menu.csv',
  })
  @IsOptional()
  menuCsv?: any;
}

export class CreateRestaurantResponseDto {
  @ApiProperty({ description: 'Success message', example: 'Restaurant created' })
  message: string;

  @ApiProperty({ description: 'Restaurant' })
  restaurant: RestaurantFormDto;
}
