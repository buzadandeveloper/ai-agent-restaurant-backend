import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendGridMailService } from '../send-grid-mail/send-grid-mail.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto, SignTokenDto } from './dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sendGridMail: SendGridMailService,
  ) {}

  async register(payload: RegisterDto) {
    const { firstName, lastName, email, password } = payload;

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashPassword,
      },
    });

    const token = randomUUID();
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.sendGridMail.sendVerificationEmail(email, link);

    return { message: 'Check your email to verify your account' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) throw new BadRequestException('Invalid token');
    if (record.expiresAt < new Date()) throw new BadRequestException('Token expired');

    await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await this.prisma.emailVerificationToken.delete({ where: { token } });

    return { message: 'Email verified successfully' };
  }

  async login(payload: LoginDto) {
    const { email, password } = payload;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.emailVerified) throw new UnauthorizedException('Email not verified');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.signToken({ userId: user.id, email: user.email });
  }

  private signToken(payload: SignTokenDto) {
    const { userId, email } = payload;

    return { accessToken: this.jwt.sign({ sub: userId, email }) };
  }
}
