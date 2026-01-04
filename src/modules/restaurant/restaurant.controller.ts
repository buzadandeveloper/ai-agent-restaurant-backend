import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { RestaurantDto, CreateRestaurantResponseDto, RestaurantFormDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { JwtUser } from '../../types/jwt-user.type';
import type { Express } from 'express';

interface AuthenticatedRequest extends Request {
  user: JwtUser;
}

@ApiTags('Restaurant')
@Controller('/api/restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}
  @ApiOperation({ summary: 'Get current user restaurants' })
  @ApiBearerAuth('JWT Authorization')
  @ApiOkResponse({
    description: 'Successfully retrieved user restaurants',
    type: [RestaurantDto],
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(JwtAuthGuard)
  @Get('my-restaurants')
  async getUserRestaurants(@Req() req: AuthenticatedRequest): Promise<RestaurantDto[]> {
    const ownerId = req.user.id;
    return this.restaurantService.getUserRestaurants(ownerId);
  }

  @ApiOperation({ summary: 'Create a new restaurant with optional menu CSV upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT Authorization')
  @ApiBody({
    type: RestaurantFormDto,
  })
  @ApiCreatedResponse({
    description: 'Restaurant created successfully',
    type: CreateRestaurantResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @ApiBadRequestResponse({ description: 'Invalid input data or file format' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('menuCsv'))
  async createRestaurant(
    @Body() body: RestaurantFormDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateRestaurantResponseDto> {
    const ownerId = req.user.id;
    return this.restaurantService.createRestaurant(body, ownerId, file);
  }

  @ApiOperation({ summary: 'Update a restaurant with optional menu CSV upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('JWT Authorization')
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: 'number' })
  @ApiBody({
    type: RestaurantFormDto,
  })
  @ApiOkResponse({
    description: 'Restaurant updated successfully',
    type: CreateRestaurantResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiForbiddenResponse({ description: 'You do not have permission to update this restaurant' })
  @ApiBadRequestResponse({ description: 'Invalid input data or file format' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('menuCsv'))
  async updateRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RestaurantFormDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateRestaurantResponseDto> {
    const ownerId = req.user.id;
    return this.restaurantService.updateRestaurant(id, body, ownerId, file);
  }

  @ApiOperation({ summary: 'Delete a restaurant and all its menu items' })
  @ApiBearerAuth('JWT Authorization')
  @ApiParam({ name: 'id', description: 'Restaurant ID', type: 'number' })
  @ApiOkResponse({
    description: 'Restaurant deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Restaurant deleted successfully' },
        restaurantId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @ApiNotFoundResponse({ description: 'Restaurant not found' })
  @ApiForbiddenResponse({ description: 'You do not have permission to delete this restaurant' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string; restaurantId: number }> {
    const ownerId = req.user.id;
    return this.restaurantService.deleteRestaurant(id, ownerId);
  }
}
