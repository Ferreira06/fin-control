// src/lib/recurring.ts
import prisma from './prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { revalidatePath } from 'next/cache';

/**
 * Esta função verifica todas as transações recorrentes ativas
 * e cria transações reais para o dia de hoje, se forem devidas
 * e ainda não tiverem sido criadas.
 */
export async function processRecurringTransactions() {
  const today = startOfDay(new Date());

  const activeRecurringTxs = await prisma.recurringTransaction.findMany({
    where: {
      startDate: { lte: today }, // Precisa ter começado
      OR: [
        { endDate: null }, // Ou não ter data de fim
        { endDate: { gte: today } }, // Ou terminar hoje ou no futuro
      ],
    },
  });

  if (activeRecurringTxs.length === 0) {
    return { createdCount: 0, message: "Nenhuma transação recorrente ativa para processar." };
  }

  const transactionsToCreate = [];

  for (const rTx of activeRecurringTxs) {
    let shouldCreate = false;
    // Lógica simples de frequência (pode ser expandida)
    if (rTx.frequency === 'MONTHLY' && rTx.startDate.getDate() === today.getDate()) {
        shouldCreate = true;
    } else if (rTx.frequency === 'DAILY') {
        shouldCreate = true;
    }
    // Lógicas para WEEKLY e YEARLY exigiriam uma verificação mais complexa.

    if (shouldCreate) {
      // Verifica se uma transação para este item recorrente já foi criada hoje
      const existingTx = await prisma.transaction.findFirst({
        where: {
          recurringTransactionId: rTx.id,
          date: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      });

      if (!existingTx) {
        transactionsToCreate.push({
          description: rTx.description,
          amount: -Math.abs(rTx.amount), // Assumindo que recorrências são despesas
          date: today,
          type: 'EXPENSE' as const,
          categoryId: rTx.categoryId,
          recurringTransactionId: rTx.id,
        });
      }
    }
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({
      data: transactionsToCreate,
    });
    // Revalida os paths para atualizar a UI para os usuários
    revalidatePath('/');
    revalidatePath('/transactions');
  }

  return { createdCount: transactionsToCreate.length, message: `Criadas ${transactionsToCreate.length} novas transações.` };
}