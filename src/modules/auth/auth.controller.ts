import { Body, Controller, Get, Post, Query, Response } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import type { Response as ResponseType } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  VerifyEmailResponseDto,
  VerifyResetCodeDto,
  VerifyResetCodeResponseDto,
} from './dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiQuery({ name: 'token', type: 'string', required: true })
  @ApiResponse({ status: 200, type: VerifyEmailResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  verifyEmail(@Query('token') token: string, @Response() res: ResponseType) {
    return this.authService.verifyEmail(token, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, type: ForgotPasswordResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Post('verify-reset-code')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, type: VerifyResetCodeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired code' })
  verifyResetCode(@Body() payload: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(payload);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, type: ResetPasswordResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }
}
