import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtThrottlerGuard } from './common/guards/jwt-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 6,
          ttl: seconds(10),
        },
      ],
      errorMessage: 'Too many requests, please try again later.',
      // upcomming in future
      // storage: new ThrottlerStorageRedisService(),
    }),
    AuthModule,
    UserModule,
    PrismaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtThrottlerGuard,
    },
  ],
})
export class AppModule {}
