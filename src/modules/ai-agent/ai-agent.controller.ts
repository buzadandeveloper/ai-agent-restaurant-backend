import { Body, Controller, HttpStatus, HttpException, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiAgentService } from './ai-agent.service';
import { SessionResponseDto } from './dto';

@ApiTags('AI Agent')
@Controller('/api/ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('session')
  @ApiOperation({
    summary: 'Create AI Agent session',
    description: 'Creates a realtime session with OpenAI AI Agent using configKey',
  })
  @ApiQuery({ name: 'configKey', description: 'User config key', type: String })
  @ApiResponse({ status: 201, description: 'Session created successfully', type: SessionResponseDto })
  @ApiResponse({ status: 404, description: 'User or restaurant not found' })
  @ApiResponse({ status: 500, description: 'Failed to create session' })
  async createSession(@Query('configKey') configKey: string, @Res() res: Response) {
    try {
      const session = await this.aiAgentService.createSession(configKey);
      return res.status(HttpStatus.CREATED).json(session);
    } catch (err) {
      if (err instanceof HttpException) {
        return res.status(err.getStatus()).json({ message: err.message });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create session' });
    }
  }

  @Post('tool/create-order')
  @ApiOperation({ summary: 'Tool call - Create order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async toolCreateOrder(
    @Body() body: { restaurantId: number; tableId: number; items: { menuItemId: number; quantity: number }[] },
  ) {
    return this.aiAgentService.createOrder(body.restaurantId, body.tableId, body.items);
  }

  @Post('tool/add-items')
  @ApiOperation({ summary: 'Tool call - Add items to order' })
  @ApiResponse({ status: 200, description: 'Items added' })
  async toolAddItems(
    @Body()
    body: {
      restaurantId: number;
      tableId: number;
      orderId: number;
      items: { menuItemId: number; quantity: number }[];
    },
  ) {
    return this.aiAgentService.addItemsToOrder(body.restaurantId, body.tableId, body.orderId, body.items);
  }
}
