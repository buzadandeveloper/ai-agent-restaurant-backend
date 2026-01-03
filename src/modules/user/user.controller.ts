import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UserService } from './user.service';
import { UserDto } from './dto';
import type { Request } from 'express';

@ApiTags('User')
@Controller('/api/user')
export class UserController {
  constructor(private user: UserService) {}

  @ApiOperation({
    summary: 'Get user profile',
    description:
      "Retrieves the authenticated user's profile information including personal details and account metadata.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getUserById(@Req() payload: Request): Promise<UserDto> {
    const userId = (payload.user as { id: number }).id;

    return this.user.getUserById(userId);
  }
}
