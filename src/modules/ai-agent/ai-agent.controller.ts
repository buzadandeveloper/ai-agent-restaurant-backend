import { Body, Controller, HttpStatus, HttpException, Post, Query, Res, Headers } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
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
    description: 'Creates a realtime session with AI provider using configKey',
  })
  @ApiQuery({ name: 'configKey', description: 'User config key', type: String })
  @ApiHeader({
    name: 'X-AI-Provider-URL',
    description: 'AI provider session endpoint URL (e.g., https://api.openai.com/v1/realtime/sessions)',
    required: true,
  })
   @ApiHeader({
     name: 'X-AI-Provider-Key',
     description: 'AI provider API key',
     required: true,
   })
   @ApiHeader({
     name: 'X-AI-Model',
     description: 'AI model name (e.g., gpt-4o-realtime-preview-2024-12-17)',
     required: true,
   })
   @ApiHeader({
     name: 'X-AI-Voice',
     description: 'AI voice type (e.g., verse)',
     required: true,
   })
   @ApiResponse({ status: 201, description: 'Session created successfully', type: SessionResponseDto })
   @ApiResponse({ status: 400, description: 'Missing required headers' })
   @ApiResponse({ status: 404, description: 'User or restaurant not found' })
   @ApiResponse({ status: 500, description: 'Failed to create session' })
   async createSession(
     @Query('configKey') configKey: string,
     @Headers('x-ai-provider-url') aiProviderUrl: string,
     @Headers('x-ai-provider-key') aiProviderApiKey: string,
     @Headers('x-ai-model') model: string,
     @Headers('x-ai-voice') voice: string,
     @Res() res: Response,
   ) {
     if (!aiProviderUrl || !aiProviderApiKey || !model || !voice) {
       return res.status(HttpStatus.BAD_REQUEST).json({
         message: 'Missing required headers: X-AI-Provider-URL, X-AI-Provider-Key, X-AI-Model, and X-AI-Voice',
       });
     }

     try {
       const session = await this.aiAgentService.createSession(configKey, aiProviderUrl, aiProviderApiKey, model, voice);
       return res.status(HttpStatus.CREATED).json(session);
    } catch (err) {
      if (err instanceof HttpException) {
        return res.status(err.getStatus()).json({ message: err.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Failed to create session', error: err instanceof Error ? err.message : String(err) });
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

  @Post('tool/pay-bill')
  @ApiOperation({ summary: 'Tool call - Pay bill' })
  @ApiResponse({ status: 200, description: 'Bill paid successfully' })
  async toolPayBill(@Body() body: { restaurantId: number; tableId: number }) {
    return this.aiAgentService.payBill(body.restaurantId, body.tableId);
  }
}
