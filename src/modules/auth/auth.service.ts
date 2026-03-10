import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendGridMailService } from '../send-grid-mail/send-grid-mail.service';
import { JwtService } from '@nestjs/jwt';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, SignTokenDto, VerifyResetCodeDto } from './dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import type { Response } from 'express';
import { TWENTY_FOUR_HOURS_IN_MS } from '../../constants/time';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sendGridMail: SendGridMailService,
  ) {}

  private generateConfigKey(): string {
    // Generate a unique config key with prefix 'acc_' followed by a random string
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `acc_${randomBytes.substring(0, 16)}`;
  }

  private generateResetCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(payload: RegisterDto) {
    const { firstName, lastName, email, password } = payload;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const configKey = this.generateConfigKey();

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashPassword,
        configKey,
      },
    });

    const token = randomUUID();
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + TWENTY_FOUR_HOURS_IN_MS),
      },
    });

    const link = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;
    await this.sendGridMail.sendVerificationEmail(email, link);

    return { message: 'Check your email to verify your account' };
  }

  async verifyEmail(token: string, res: Response) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res.redirect(`${process.env.FRONTEND_URL}/authenticate?tab=login&status=invalidToken`);
    }

    if (record.expiresAt < new Date()) {
      return res.redirect(`${process.env.FRONTEND_URL}/authenticate?tab=login&status=tokenExpired`);
    }

    await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await this.prisma.emailVerificationToken.delete({ where: { token } });

    return res.redirect(`${process.env.FRONTEND_URL}/authenticate?tab=login&status=verified`);
  }

  async login(payload: LoginDto) {
    const { email, password } = payload;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.signToken({ userId: user.id, email: user.email });
  }

  private signToken(payload: SignTokenDto) {
    const { userId, email } = payload;

    return { accessToken: this.jwt.sign({ id: userId, email }) };
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const { email } = payload;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Delete any existing reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate 6-digit code
    const code = this.generateResetCode();

    // Create new reset token (expires in 15 minutes)
    await this.prisma.passwordResetToken.create({
      data: {
        token: code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    await this.sendGridMail.sendPasswordResetEmail(email, code);

    return { message: 'Password reset code has been sent to your email' };
  }

  async verifyResetCode(payload: VerifyResetCodeDto) {
    const { email, code } = payload;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: code,
        userId: user.id,
      },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('Invalid reset code');
    }

    if (resetRecord.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      throw new UnauthorizedException('Reset code has expired');
    }

    // Generate a temporary token for password reset
    const resetToken = randomUUID();

    // Update the reset token with the new token (extends expiry by 5 minutes)
    await this.prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: {
        token: resetToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to complete reset
      },
    });

    return { message: 'Code verified successfully', resetToken };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const { resetToken, newPassword } = payload;

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetToken },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (resetRecord.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      throw new UnauthorizedException('Reset token has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // Delete the reset token
    await this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return { message: 'Password has been reset successfully' };
  }
}
