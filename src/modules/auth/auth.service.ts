import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendGridMailService } from '../send-grid-mail/send-grid-mail.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto, SignTokenDto } from './dto';
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
}
