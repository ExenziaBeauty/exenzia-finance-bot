import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSyncService } from '../conta-azul/customer-sync.service';
import { SalesSyncService } from '../conta-azul/sales-sync.service';

@Injectable()
export class PollingService {
  private readonly logger = new Logger(PollingService.name);
  private readonly defaultStart = new Date(0);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerSync: CustomerSyncService,
    private readonly salesSync: SalesSyncService,
  ) {}

  @Cron('*/60 * * * * *')
  async handleCron(): Promise<void> {
    const state = await this.getLastPollState();
    this.logger.log(`Running synchronization from ${state.toISOString()}`);

    await this.customerSync.sync(state);
    await this.salesSync.sync(state);

    await this.prisma.pollState.upsert({
      where: { id: 1 },
      update: { lastPolledAt: new Date() },
      create: { id: 1, lastPolledAt: new Date() },
    });
  }

  private async getLastPollState(): Promise<Date> {
    const state = await this.prisma.pollState.findUnique({ where: { id: 1 } });
    if (!state) {
      return this.defaultStart;
    }
    return state.lastPolledAt;
  }
}
