import { ApiProperty } from '@nestjs/swagger';

export class DailyStatDto {
  @ApiProperty({ example: '2026-03-06' })
  date: Date;

  @ApiProperty({ example: 15 })
  ordersCount: number;

  @ApiProperty({ example: 450.5 })
  totalRevenue: number;

  @ApiProperty({ example: 'MDL' })
  currency: string;

  @ApiProperty({ example: 30.03 })
  averageOrderValue: number;
}

export class DailyStatsResponseDto {
  @ApiProperty({ example: 1 })
  restaurantId: number;

  @ApiProperty({ example: 'Restaurant Name' })
  restaurantName: string;

  @ApiProperty({
    example: {
      startDate: '2026-02-06T00:00:00.000Z',
      endDate: '2026-03-06T23:59:59.999Z',
    },
  })
  period: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    example: {
      totalOrders: 450,
      totalRevenue: 13515.0,
      currency: 'MDL',
      averageOrderValue: 30.03,
      daysWithOrders: 28,
    },
  })
  summary: {
    totalOrders: number;
    totalRevenue: number;
    currency: string;
    averageOrderValue: number;
    daysWithOrders: number;
  };

  @ApiProperty({ type: [DailyStatDto] })
  dailyData: DailyStatDto[];
}
