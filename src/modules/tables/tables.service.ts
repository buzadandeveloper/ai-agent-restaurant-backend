import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates tables for a restaurant based on numberOfTables.
   * If tables already exist, returns them without recreating.
   */
  private async generateTablesForRestaurant(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { tables: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // If tables already exist, don't regenerate them
    if (restaurant.tables.length > 0) {
      return restaurant.tables;
    }

    // Create the tables
    const tablesToCreate = Array.from({ length: restaurant.numberOfTables }, (_, i) => ({
      tableNumber: i + 1,
      restaurantId: restaurantId,
    }));

    await this.prisma.table.createMany({
      data: tablesToCreate,
    });

    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
    });
  }

  /**
   * Gets all tables of a restaurant with their occupancy status.
   * If tables don't exist, generates them automatically.
   */
  async getTablesByRestaurant(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let tables = await this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // If no tables exist, generate them
    if (tables.length === 0) {
      await this.generateTablesForRestaurant(restaurantId);
      tables = await this.prisma.table.findMany({
        where: { restaurantId },
        orderBy: { tableNumber: 'asc' },
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
    }

    // Transform tables to include occupancy status
    const tablesWithStatus = tables.map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      restaurantId: table.restaurantId,
      isOccupied: table._count.orders > 0,
      activeOrdersCount: table._count.orders,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    }));

    return {
      restaurantName: restaurant.name,
      tables: tablesWithStatus,
    };
  }

  /**
   * Gets a specific table with all its orders.
   * Validates that the table belongs to the specified restaurant.
   */
  async getTableById(restaurantId: number, tableId: number) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      include: {
        restaurant: true,
        orders: {
          include: {
            items: {
              include: {
                menuItem: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found in this restaurant');
    }

    return table;
  }
}
