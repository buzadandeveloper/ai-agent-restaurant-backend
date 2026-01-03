import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtUser } from '../../types/jwt-user.type';

@Injectable()
export class JwtThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as JwtUser;

    return user?.id ? `user:${user.id}` : req.ip!;
  }
}
