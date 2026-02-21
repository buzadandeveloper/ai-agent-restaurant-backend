import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderStatus } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderTablesService {
  constructor(private prisma: PrismaService) {}

  // ===== TABLES =====

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
   * Gets all tables of a restaurant with active orders.
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
        orders: {
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED'],
            },
          },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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
          orders: {
            where: {
              status: {
                notIn: ['COMPLETED', 'CANCELLED'],
              },
            },
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    return tables;
  }

  /**
   * Gets a specific table with all its orders (active and historical).
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

  // ===== ORDERS =====

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
    const order = await this.prisma.order.create({
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

    return order;
  }

  /**
   * Ensures tables exist for a restaurant, creates them if they don't.
   */
  private async ensureTablesExist(restaurantId: number): Promise<void> {
    const tablesCount = await this.prisma.table.count({
      where: { restaurantId },
    });

    if (tablesCount === 0) {
      await this.generateTablesForRestaurant(restaurantId);
    }
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
   * Updates the status of an order.
   * Validates that the order belongs to the specified restaurant and table.
   */
  async updateOrderStatus(restaurantId: number, tableId: number, orderId: number, dto: UpdateOrderStatusDto) {
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

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
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
   * Cancels an order (marks as CANCELLED).
   * Validates that the order belongs to the specified restaurant and table.
   */
  async cancelOrder(restaurantId: number, tableId: number, orderId: number) {
    return this.updateOrderStatus(restaurantId, tableId, orderId, {
      status: OrderStatus.CANCELLED,
    });
  }

  /**
   * Adds items to an existing order.
   * Does not allow adding to completed or cancelled orders.
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

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add items to completed or cancelled order');
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
