import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { buildAgentConfig } from './utils/build-agent-config';
import { CreateOrderDto, CreateOrderItemDto } from '../orders/dto';
import { AxiosResponse } from 'axios';
import axios from 'axios';
import { SessionResponseDto } from './dto';
import { getKnowledgeBase } from './utils/get-knowledge-base';

@Injectable()
export class AiAgentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {}

  async createSession(configKey: string, aiProviderUrl: string, aiProviderApiKey: string, model:string, voice:string): Promise<SessionResponseDto> {
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

    const knowledgeBase = getKnowledgeBase(user);
    const agentConfig = buildAgentConfig(knowledgeBase, model, voice);

    try {
      const response: AxiosResponse<SessionResponseDto> = await axios.post(aiProviderUrl, agentConfig, {
        headers: {
          Authorization: `Bearer ${aiProviderApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create session',
        error,
      });
    }
  }

  async createOrder(restaurantId: number, tableId: number, items: CreateOrderItemDto[]) {
    const createOrderDto: CreateOrderDto = { items };
    return this.ordersService.createOrder(restaurantId, tableId, createOrderDto);
  }

  async addItemsToOrder(restaurantId: number, tableId: number, orderId: number, items: CreateOrderItemDto[]) {
    return this.ordersService.addItemsToOrder(restaurantId, tableId, orderId, items);
  }

  async payBill(restaurantId: number, tableId: number) {
    return this.ordersService.payBill(restaurantId, tableId);
  }
}
