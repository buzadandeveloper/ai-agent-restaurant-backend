import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(restaurantId: number, tableId: number, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    // 1. Validate restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // 2. Validate table exists and belongs to this restaurant
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found in this restaurant');
    }

    // 3. Validate all menu items exist, are available AND belong to this restaurant
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        category: {
          restaurantId,
        },
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      const foundIds = menuItems.map((item) => item.id);
      const missingIds = menuItemIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Menu items not found or unavailable in this restaurant: ${missingIds.join(', ')}`);
    }

    // 4. Calculate total
    let total = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      }
      const itemTotal = Number(menuItem.price) * item.quantity;
      total += itemTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
      };
    });

    // 5. Create the order
    return this.prisma.order.create({
      data: {
        tableId: table.id,
        total: new Prisma.Decimal(total),
        currency: menuItems[0].currency,
        items: {
          create: orderItems,
        },
      },
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
        table: true,
      },
    });
  }

  /**
   * Adds items to an existing order.
   * Validates that new items belong to the same restaurant and order is at correct table.
   */
  async addItemsToOrder(restaurantId: number, tableId: number, orderId: number, items: CreateOrderItemDto[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        table: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.table.restaurantId !== restaurantId) {
      throw new NotFoundException('Order not found in this restaurant');
    }

    if (order.tableId !== tableId) {
      throw new NotFoundException('Order not found at this table');
    }

    // Get item prices and validate they belong to the same restaurant
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        category: {
          restaurantId,
        },
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      const foundIds = menuItems.map((item) => item.id);
      const missingIds = menuItemIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Menu items not found or unavailable in this restaurant: ${missingIds.join(', ')}`);
    }

    // Calculate new total
    let additionalTotal = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      }
      const itemTotal = Number(menuItem.price) * item.quantity;
      additionalTotal += itemTotal;
      return {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
      };
    });

    // Add items and update total
    await this.prisma.orderItem.createMany({
      data: orderItems,
    });

    const newTotal = Number(order.total) + additionalTotal;

    return this.prisma.order.update({
      where: { id: orderId },
      data: { total: new Prisma.Decimal(newTotal) },
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
        table: true,
      },
    });
  }

  async payBill(restaurantId: number, tableId: number) {
    const table = await this.prisma.table.findUnique({
      where: {
        id: tableId,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found in this restaurant');
    }

    if (table.orders.length === 0) {
      throw new BadRequestException('No active orders at this table');
    }

    const firstOrder = table.orders[0];
    const totalAmount = table.orders.reduce((sum, order) => sum + Number(order.total), 0);
    const currency = firstOrder.currency;

    const allItems = table.orders.flatMap((order) =>
      order.items.map((item) => ({
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
      })),
    );

    await this.prisma.$transaction(async (prisma) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyStats.upsert({
        where: {
          restaurantId_date: {
            restaurantId,
            date: today,
          },
        },
        update: {
          ordersCount: { increment: table.orders.length },
          totalRevenue: { increment: new Prisma.Decimal(totalAmount) },
        },
        create: {
          restaurantId,
          date: today,
          ordersCount: table.orders.length,
          totalRevenue: new Prisma.Decimal(totalAmount),
          currency,
        },
      });

      await prisma.order.deleteMany({
        where: {
          tableId: table.id,
        },
      });
    });

    return {
      message: 'Bill paid successfully',
      tableNumber: table.tableNumber,
      ordersCount: table.orders.length,
      totalAmount,
      currency,
      items: allItems,
    };
  }
}
