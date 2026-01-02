import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { SendGridMailModule } from './modules/send-grid-mail/send-grid-mail.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, SendGridMailModule, PrismaModule],
})
export class AppModule {}
