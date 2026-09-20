import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ContaAzulModule } from './modules/conta-azul/conta-azul.module';
import { PollingModule } from './modules/polling/polling.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ProspectingModule } from './modules/prospecting/prospecting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MessagingModule,
    ContaAzulModule,
    PollingModule,
    ProspectingModule,
  ],
})
export class AppModule {}
