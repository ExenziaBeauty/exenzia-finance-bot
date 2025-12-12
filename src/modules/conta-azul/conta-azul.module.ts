import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ContaAzulService } from './conta-azul.service';
import { TokenService } from './token.service';
import { CustomerSyncService } from './customer-sync.service';
import { SalesSyncService } from './sales-sync.service';
import { RateLimitService } from '../../common/rate-limit.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [HttpModule, ConfigModule, MessagingModule],
  providers: [ContaAzulService, TokenService, CustomerSyncService, SalesSyncService, RateLimitService],
  exports: [ContaAzulService, CustomerSyncService, SalesSyncService, TokenService],
})
export class ContaAzulModule {}
