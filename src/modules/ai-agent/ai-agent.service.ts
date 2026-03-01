import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { buildAgentConfig } from './utils/build-agent-config';
import { CreateOrderDto, CreateOrderItemDto } from '../orders/dto';
import { SessionResponseDto } from './dto/index';
import axios from 'axios';

@Injectable()
export class AiAgentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {}

  async createSession(configKey: string) {
    const user = await this.prisma.user.findUnique({
      where: { configKey },
      include: {
        restaurants: {
          include: {
            tables: true,
            categories: {
              include: {
                items: {
                  where: {
                    isAvailable: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.restaurants.length === 0) {
      throw new NotFoundException('User or restaurant not found');
    }

    const agentConfig = buildAgentConfig(user);

    const response = await axios.post<SessionResponseDto>('https://api.openai.com/v1/realtime/sessions', agentConfig, {
      headers: {
        Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async createOrder(restaurantId: number, tableId: number, items: CreateOrderItemDto[]) {
    const createOrderDto: CreateOrderDto = { items };
    return this.ordersService.createOrder(restaurantId, tableId, createOrderDto);
  }

  async addItemsToOrder(restaurantId: number, tableId: number, orderId: number, items: CreateOrderItemDto[]) {
    return this.ordersService.addItemsToOrder(restaurantId, tableId, orderId, items);
  }
}
