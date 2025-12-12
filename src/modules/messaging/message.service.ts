import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  async sendSaleCreated(saleId: string): Promise<void> {
    this.logger.log(`Stub sendSaleCreated for sale ${saleId}`);
  }

  async sendSaleInvoiced(saleId: string): Promise<void> {
    this.logger.log(`Stub sendSaleInvoiced for sale ${saleId}`);
  }

  async sendPaymentReminder(installmentId: string): Promise<void> {
    this.logger.log(`Stub sendPaymentReminder for installment ${installmentId}`);
  }
}
