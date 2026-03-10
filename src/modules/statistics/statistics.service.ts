import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDailyStats(restaurantId: number, startDate?: Date, endDate?: Date) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const stats = await this.prisma.dailyStats.findMany({
      where: {
        restaurantId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const allDates: Date[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Map stats to a dictionary for quick lookup
    const statsMap = new Map(stats.map((stat) => [stat.date.toISOString().split('T')[0], stat]));

    // Build daily data with all dates
    const dailyData = allDates.map((date) => {
      const dateKey = date.toISOString().split('T')[0];
      const stat = statsMap.get(dateKey);

      if (stat) {
        return {
          date: stat.date,
          ordersCount: stat.ordersCount,
          totalRevenue: Number(stat.totalRevenue),
          currency: stat.currency,
          averageOrderValue: stat.ordersCount > 0 ? Number(stat.totalRevenue) / stat.ordersCount : 0,
        };
      }

      return {
        date,
        ordersCount: 0,
        totalRevenue: 0,
        currency: 'MDL',
        averageOrderValue: 0,
      };
    });

    return {
      restaurantId,
      restaurantName: restaurant.name,
      period: {
        startDate: start,
        endDate: end,
      },
      dailyData,
    };
  }
}
