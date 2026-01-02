import { Module } from '@nestjs/common';
import { SendGridMailService } from './send-grid-mail.service';

@Module({
  providers: [SendGridMailService],
  exports: [SendGridMailService],
})
export class SendGridMailModule {}
