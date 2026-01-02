import { IsEmail, IsInt } from 'class-validator';

export class SignTokenDto {
  @IsInt()
  userId: number;

  @IsEmail()
  email: string;
}
