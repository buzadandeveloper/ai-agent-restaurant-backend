import { IsEmail, MinLength, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
