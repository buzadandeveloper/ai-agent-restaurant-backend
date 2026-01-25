import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { TWENTY_FOUR_HOURS_IN_MS } from '../../../constants/time';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async deleteUnverifiedUsers() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_IN_MS);

      const result = await this.prisma.user.deleteMany({
        where: {
          emailVerified: false,
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} unverified users`);
    } catch (error) {
      this.logger.error('Failed to delete unverified users', error);
    }
  }
}
