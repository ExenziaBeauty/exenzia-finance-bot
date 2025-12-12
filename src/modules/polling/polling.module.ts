import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PollingService } from './polling.service';
import { ContaAzulModule } from '../conta-azul/conta-azul.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), ContaAzulModule, PrismaModule],
  providers: [PollingService],
})
export class PollingModule {}
