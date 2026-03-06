import { ApiProperty } from '@nestjs/swagger';

export class PayBillResponseDto {
  @ApiProperty({ example: 'Bill paid successfully' })
  message: string;

  @ApiProperty({ example: 5 })
  tableNumber: number;

  @ApiProperty({ example: 2 })
  ordersCount: number;

  @ApiProperty({ example: 75.5 })
  totalAmount: number;

  @ApiProperty({ example: 'MDL' })
  currency: string;

  @ApiProperty({
    example: [
      {
        menuItemName: 'Pizza Margherita',
        quantity: 2,
        price: 12.5,
        total: 25.0,
      },
    ],
  })
  items: {
    menuItemName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}
