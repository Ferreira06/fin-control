// file: src/lib/recurring.ts

import prisma from './prisma';
import { TransactionType } from '@prisma/client';
import { add, isToday, isBefore, startOfDay, endOfDay } from 'date-fns';

export async function processRecurringTransactions() {
  const recurringTxs = await prisma.recurringTransaction.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      startDate: { lte: new Date() },
    },
  });

  const transactionsToCreate = [];

  for (const rTx of recurringTxs) {
    let nextDate = rTx.startDate;
    let shouldCreate = false;

    while (isBefore(nextDate, new Date()) || isToday(nextDate)) {
      if (isToday(nextDate)) {
        // CORREÇÃO: Usar startOfDay e endOfDay para criar objetos Date corretamente
        // A função .setHours() retorna um número (timestamp), não um objeto Date.
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const existingTx = await prisma.transaction.findFirst({
          where: {
            recurringTransactionId: rTx.id,
            date: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (!existingTx) {
          shouldCreate = true;
        }
        break;
      }

      switch (rTx.frequency) {
        case 'DAILY': nextDate = add(nextDate, { days: 1 }); break;
        case 'WEEKLY': nextDate = add(nextDate, { weeks: 1 }); break;
        case 'MONTHLY': nextDate = add(nextDate, { months: 1 }); break;
        case 'YEARLY': nextDate = add(nextDate, { years: 1 }); break;
      }
    }

    if (shouldCreate) {
      transactionsToCreate.push({
        amount: -Math.abs(rTx.amount),
        description: rTx.description,
        date: new Date(),
        // CORREÇÃO: Usar o enum TransactionType em vez de uma string 'EXPENSE'
        type: TransactionType.EXPENSE,
        categoryId: rTx.categoryId,
        recurringTransactionId: rTx.id,
      });
    }
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({
      data: transactionsToCreate,
    });
    console.log(`Criadas ${transactionsToCreate.length} transações recorrentes.`);
  } else {
    console.log('Nenhuma transação recorrente para criar hoje.');
  }
}