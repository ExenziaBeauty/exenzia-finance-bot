import { PrismaClient, PersonType, SaleStatus, InstallmentStatus } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.customer.upsert({
    where: { id: 'demo-customer' },
    update: {},
    create: {
      id: 'demo-customer',
      name: 'Conta Azul Demo',
      personType: PersonType.FISICA,
      document: '00000000000',
    },
  });

  await prisma.sale.upsert({
    where: { id: 'demo-sale' },
    update: {},
    create: {
      id: 'demo-sale',
      number: '1000',
      status: SaleStatus.EM_ANDAMENTO,
      totalValue: 199.9,
      customerId: 'demo-customer',
      saleDate: new Date(),
      updatedAt: new Date(),
      installments: {
        create: [
          {
            dueDate: dayjs().add(7, 'day').toDate(),
            amount: 99.95,
            status: InstallmentStatus.OPEN,
          },
          {
            dueDate: dayjs().add(14, 'day').toDate(),
            amount: 99.95,
            status: InstallmentStatus.OPEN,
          },
        ],
      },
    },
  });

  await prisma.pollState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastPolledAt: new Date(0) },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
