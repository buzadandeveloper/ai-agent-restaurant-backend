import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyResetCodeResponseDto {
  @ApiProperty({ example: 'Code verified successfully' })
  message: string;

  @ApiProperty({ example: 'reset-token-here' })
  resetToken: string;
}
