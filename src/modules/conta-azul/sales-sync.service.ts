import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContaAzulService } from './conta-azul.service';
import { MessageService } from '../messaging/message.service';
import dayjs from 'dayjs';

interface ContaAzulSaleParcel {
  vencimento: string;
  valor: number;
  status: string;
}

interface ContaAzulSale {
  id: string;
  numero: string;
  situacao: keyof typeof SaleStatus;
  valorTotal: number;
  cliente: { id: string };
  dataEmissao: string;
  dataAlteracao: string;
  idLegado?: string;
  condicaoPagamento?: { parcelas: ContaAzulSaleParcel[] };
}

@Injectable()
export class SalesSyncService {
  private readonly logger = new Logger(SalesSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contaAzul: ContaAzulService,
    private readonly messageService: MessageService,
  ) {}

  async sync(updatedAfter: Date): Promise<void> {
    const params = {
      data_alteracao_de: updatedAfter.toISOString(),
      data_alteracao_ate: new Date().toISOString(),
    };

    const sales = await this.contaAzul.get<ContaAzulSale[]>('/v1/venda/busca', { params });

    for (const sale of sales) {
      const payload: Prisma.SaleUpsertArgs['create'] = {
        id: sale.id,
        legacyId: sale.idLegado,
        number: sale.numero,
        status: (sale.situacao as SaleStatus) || SaleStatus.EM_ANDAMENTO,
        totalValue: sale.valorTotal,
        customerId: sale.cliente.id,
        saleDate: sale.dataEmissao ? new Date(sale.dataEmissao) : new Date(),
        updatedAt: sale.dataAlteracao ? new Date(sale.dataAlteracao) : new Date(),
        installments: {
          deleteMany: {},
          create: sale.condicaoPagamento?.parcelas?.map((parcel) => ({
            dueDate: new Date(parcel.vencimento),
            amount: parcel.valor,
            status: this.resolveInstallmentStatus(parcel),
          })) || [],
        },
      };

      const existing = await this.prisma.sale.findUnique({ where: { id: sale.id } });
      await this.prisma.sale.upsert({
        where: { id: sale.id },
        update: payload,
        create: payload,
      });

      if (!existing) {
        await this.messageService.sendSaleCreated(sale.id);
      } else if (payload.status === SaleStatus.FATURADO && existing.status !== SaleStatus.FATURADO) {
        await this.messageService.sendSaleInvoiced(sale.id);
      }

      await this.triggerPaymentReminders(sale.id);
    }

    this.logger.log(`Synchronized ${sales.length} sales.`);
  }

  private resolveInstallmentStatus(parcel: ContaAzulSaleParcel): string {
    const now = dayjs();
    const due = dayjs(parcel.vencimento);
    if (parcel.status?.toUpperCase() === 'PAGO') {
      return 'PAID';
    }
    if (due.isBefore(now)) {
      return 'OVERDUE';
    }
    return 'OPEN';
  }

  private async triggerPaymentReminders(saleId: string): Promise<void> {
    const installments = await this.prisma.paymentInstallment.findMany({
      where: { saleId, status: 'OVERDUE' },
    });

    for (const installment of installments) {
      await this.messageService.sendPaymentReminder(installment.id);
    }
  }
}
