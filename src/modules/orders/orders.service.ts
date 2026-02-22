import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new order for a table.
   * Validates the restaurant and table with full security checks.
   * Table ID comes from the URL path (client is at this table).
   */
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
          restaurantId, // Critical security check - ensures items belong to this restaurant
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
   * Gets a specific order with all details.
   * Validates that the order belongs to the specified restaurant and table.
   */
  async getOrderById(restaurantId: number, tableId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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

    return order;
  }

  /**
   * Cancels an order (deletes it).
   * Validates that the order belongs to the specified restaurant and table.
   */
  async cancelOrder(restaurantId: number, tableId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
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

    return this.prisma.order.delete({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
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
  async addItemsToOrder(
    restaurantId: number,
    tableId: number,
    orderId: number,
    items: { menuItemId: number; quantity: number }[],
  ) {
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
          restaurantId, // Critical security check
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
}
