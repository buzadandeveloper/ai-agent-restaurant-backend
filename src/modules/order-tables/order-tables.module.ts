import { Module } from '@nestjs/common';
import { OrderTablesService } from './order-tables.service';
import { OrderTablesController } from './order-tables.controller';

@Module({
  controllers: [OrderTablesController],
  providers: [OrderTablesService],
})
export class OrderTablesModule {}
