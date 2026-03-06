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

    const totalOrders = stats.reduce((sum, stat) => sum + stat.ordersCount, 0);
    const totalRevenue = stats.reduce((sum, stat) => sum + Number(stat.totalRevenue), 0);

    return {
      restaurantId,
      restaurantName: restaurant.name,
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalOrders,
        totalRevenue,
        currency: stats[0]?.currency || 'MDL',
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        daysWithOrders: stats.filter((s) => s.ordersCount > 0).length,
      },
      dailyData: stats.map((stat) => ({
        date: stat.date,
        ordersCount: stat.ordersCount,
        totalRevenue: Number(stat.totalRevenue),
        currency: stat.currency,
        averageOrderValue: stat.ordersCount > 0 ? Number(stat.totalRevenue) / stat.ordersCount : 0,
      })),
    };
  }
}
