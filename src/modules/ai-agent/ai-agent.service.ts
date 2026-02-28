import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import axios from 'axios';

@Injectable()
export class AiAgentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {}

  async createSession(configKey: string) {
    // 1. Find user by configKey with all restaurants, tables and menu
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

    // 2. Prepare structured knowledge base for AI
    const knowledgeBase = {
      owner: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      restaurants: user.restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        address: r.address,
        phone: r.phone,
        tables: r.tables.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
        })),
        menu: r.categories.map((cat) => ({
          category: cat.name,
          items: cat.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            currency: item.currency,
            tags: item.tags,
            allergens: item.allergens,
          })),
        })),
      })),
    };

    const response = await axios.post(
      'https://api.openai.com/v1/realtime/sessions',
      {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse',
        instructions: `
Vorbești doar în limba română. Ești asistentul pentru restaurantele proprietarului ${user.firstName} ${user.lastName}.

KNOWLEDGE BASE (Date structurate - accesează direct proprietățile):
${JSON.stringify(knowledgeBase, null, 2)}

PROCES DE COMANDĂ:

PASUL 1: Întreabă clientul: "Bună ziua! La ce restaurant vă aflați?" 
        - Caută în knowledgeBase.restaurants după nume sau adresă
        - Reține restaurantId

PASUL 2: Întreabă: "La ce masă vă aflați?"
        - Caută în restaurant.tables după tableNumber
        - Reține tableId

PASUL 3: Ajută clientul să comande din restaurant.menu
        - Folosește item.id ca menuItemId în comenzi

ENDPOINT-URI pentru comenzi (AI Agent le apelează automat):

Tools disponibile:
- create_order(restaurantId, tableId, items)
- get_order(restaurantId, tableId, orderId)
- add_items_to_order(restaurantId, tableId, orderId, items)
- cancel_order(restaurantId, tableId, orderId)

IMPORTANT: Folosește DOAR produse din meniul restaurantului selectat!

Fii prietenos, ajută clientul să aleagă din meniu și explică preparatele.
`,
        tools: [
          {
            type: 'function',
            name: 'create_order',
            description: 'Creează o comandă nouă pentru masa clientului',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: {
                  type: 'number',
                  description: 'ID-ul restaurantului (identificat din conversație cu clientul)',
                },
                tableId: {
                  type: 'number',
                  description: 'ID-ul mesei (nu numărul mesei - verifică din lista de mese)',
                },
                items: {
                  type: 'array',
                  description: 'Lista de produse comandate',
                  items: {
                    type: 'object',
                    properties: {
                      menuItemId: {
                        type: 'number',
                        description: 'ID-ul produsului din meniu',
                      },
                      quantity: {
                        type: 'number',
                        description: 'Cantitatea dorită',
                      },
                    },
                    required: ['menuItemId', 'quantity'],
                  },
                },
              },
              required: ['restaurantId', 'tableId', 'items'],
            },
          },
          {
            type: 'function',
            name: 'get_order',
            description: 'Obține detaliile unei comenzi existente',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: {
                  type: 'number',
                  description: 'ID-ul restaurantului',
                },
                tableId: {
                  type: 'number',
                  description: 'ID-ul mesei',
                },
                orderId: {
                  type: 'number',
                  description: 'ID-ul comenzii',
                },
              },
              required: ['restaurantId', 'tableId', 'orderId'],
            },
          },
          {
            type: 'function',
            name: 'add_items_to_order',
            description: 'Adaugă produse la o comandă existentă',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: {
                  type: 'number',
                  description: 'ID-ul restaurantului',
                },
                tableId: {
                  type: 'number',
                  description: 'ID-ul mesei',
                },
                orderId: {
                  type: 'number',
                  description: 'ID-ul comenzii existente',
                },
                items: {
                  type: 'array',
                  description: 'Lista de produse de adăugat',
                  items: {
                    type: 'object',
                    properties: {
                      menuItemId: {
                        type: 'number',
                        description: 'ID-ul produsului din meniu',
                      },
                      quantity: {
                        type: 'number',
                        description: 'Cantitatea dorită',
                      },
                    },
                    required: ['menuItemId', 'quantity'],
                  },
                },
              },
              required: ['restaurantId', 'tableId', 'orderId', 'items'],
            },
          },
          {
            type: 'function',
            name: 'cancel_order',
            description: 'Anulează o comandă existentă',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: {
                  type: 'number',
                  description: 'ID-ul restaurantului',
                },
                tableId: {
                  type: 'number',
                  description: 'ID-ul mesei',
                },
                orderId: {
                  type: 'number',
                  description: 'ID-ul comenzii de anulat',
                },
              },
              required: ['restaurantId', 'tableId', 'orderId'],
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  // Tool call handlers
  async createOrder(restaurantId: number, tableId: number, items: { menuItemId: number; quantity: number }[]) {
    return this.ordersService.createOrder(restaurantId, tableId, { items });
  }

  async getOrder(restaurantId: number, tableId: number, orderId: number) {
    return this.ordersService.getOrderById(restaurantId, tableId, orderId);
  }

  async addItemsToOrder(
    restaurantId: number,
    tableId: number,
    orderId: number,
    items: { menuItemId: number; quantity: number }[],
  ) {
    return this.ordersService.addItemsToOrder(restaurantId, tableId, orderId, items);
  }

  async cancelOrder(restaurantId: number, tableId: number, orderId: number) {
    return this.ordersService.cancelOrder(restaurantId, tableId, orderId);
  }
}
