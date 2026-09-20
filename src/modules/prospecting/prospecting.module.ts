import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ProspectingService } from './prospecting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, PrismaModule],
  providers: [ProspectingService],
  exports: [ProspectingService],
})
export class ProspectingModule {}
