import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContaAzulService } from './conta-azul.service';

interface ContaAzulCustomer {
  id: string;
  nome: string;
  cpfCnpj?: string;
  tipo: 'FISICA' | 'JURIDICA';
  idLegado?: string;
}

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(private readonly prisma: PrismaService, private readonly contaAzul: ContaAzulService) {}

  async sync(updatedAfter: Date): Promise<void> {
    const params = {
      data_alteracao_de: updatedAfter.toISOString(),
      data_alteracao_ate: new Date().toISOString(),
    };

    const customers = await this.contaAzul.get<ContaAzulCustomer[]>('/v1/clientes', { params });

    for (const customer of customers) {
      await this.prisma.customer.upsert({
        where: { id: customer.id },
        update: {
          name: customer.nome,
          document: customer.cpfCnpj,
          legacyId: customer.idLegado,
          personType: customer.tipo,
        },
        create: {
          id: customer.id,
          name: customer.nome,
          document: customer.cpfCnpj,
          legacyId: customer.idLegado,
          personType: customer.tipo,
        },
      });
    }

    this.logger.log(`Synchronized ${customers.length} customers.`);
  }
}
