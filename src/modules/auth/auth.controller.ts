import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  LoginResponseDto,
  ErrorResponseDto,
} from './dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account and sends email verification. The user will receive an email with a verification link that must be clicked before they can log in.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration details including first name, last name, email, and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. Email verification sent.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    type: ErrorResponseDto,
  })
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email',
    description:
      'Verifies user email using the verification token sent via email during registration. This endpoint is typically called when the user clicks the verification link in their email.',
  })
  @ApiQuery({
    name: 'token',
    type: 'string',
    description: 'Email verification token (UUID format)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified. User can now log in.',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or expired token',
    type: ErrorResponseDto,
  })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns a JWT access token that must be included in the Authorization header for protected routes.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials (email and password)',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated. Returns JWT access token.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials or email not verified',
    type: ErrorResponseDto,
  })
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }
}
