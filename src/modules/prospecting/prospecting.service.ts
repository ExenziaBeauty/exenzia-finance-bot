import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from '../messaging/message.service';

interface ProspectCandidate {
  customerId: string;
  customerName: string;
  reason: 'REACTIVATION' | 'NEW_LEAD';
  lastSaleDate?: Date;
  totalValue: number;
}

@Injectable()
export class ProspectingService {
  private readonly logger = new Logger(ProspectingService.name);

  private readonly inactivityDays: number;
  private readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly config: ConfigService,
  ) {
    this.inactivityDays = Number(this.config.get('PROSPECTING_INACTIVITY_DAYS') ?? 60);
    this.batchSize = Number(this.config.get('PROSPECTING_BATCH_SIZE') ?? 20);
  }

  @Cron('0 8 * * 1')
  async handleCron(): Promise<void> {
    const prospects = await this.identifyProspects();
    this.logger.log(`Identified ${prospects.length} prospecting candidates.`);

    for (const prospect of prospects) {
      await this.messageService.sendProspectingApproach(prospect.customerId, this.buildApproachMessage(prospect));
    }
  }

  async identifyProspects(): Promise<ProspectCandidate[]> {
    const cutoff = dayjs().subtract(this.inactivityDays, 'day').toDate();

    const customers = await this.prisma.customer.findMany({
      include: {
        sales: {
          orderBy: { saleDate: 'desc' },
        },
      },
    });

    const candidates: ProspectCandidate[] = [];

    for (const customer of customers) {
      const totalValue = customer.sales.reduce((sum, sale) => sum + Number(sale.totalValue), 0);
      const lastSale = customer.sales[0];

      if (!lastSale) {
        candidates.push({
          customerId: customer.id,
          customerName: customer.name,
          reason: 'NEW_LEAD',
          totalValue: 0,
        });
        continue;
      }

      if (dayjs(lastSale.saleDate).isBefore(cutoff)) {
        candidates.push({
          customerId: customer.id,
          customerName: customer.name,
          reason: 'REACTIVATION',
          lastSaleDate: lastSale.saleDate,
          totalValue,
        });
      }
    }

    return this.prioritize(candidates).slice(0, this.batchSize);
  }

  private prioritize(candidates: ProspectCandidate[]): ProspectCandidate[] {
    return [...candidates].sort((a, b) => {
      if (a.reason !== b.reason) {
        return a.reason === 'REACTIVATION' ? -1 : 1;
      }
      return b.totalValue - a.totalValue;
    });
  }

  private buildApproachMessage(prospect: ProspectCandidate): string {
    if (prospect.reason === 'NEW_LEAD') {
      return `Ola ${prospect.customerName}, ainda nao vimos sua primeira compra por aqui. Posso te ajudar a encontrar a melhor opcao para voce?`;
    }

    const daysSinceLastSale = dayjs().diff(prospect.lastSaleDate, 'day');
    return `Ola ${prospect.customerName}, faz ${daysSinceLastSale} dias desde sua ultima compra conosco. Temos novidades que podem te interessar!`;
  }
}
