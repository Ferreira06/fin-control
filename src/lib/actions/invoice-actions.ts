'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function payInvoice(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  const invoiceId = formData.get('invoiceId') as string;
  const accountId = formData.get('accountId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const cardId = formData.get('cardId') as string;

  if (!invoiceId || !accountId || !amount) return { success: false, message: "Dados incompletos." };

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { creditCard: true } });

      if (!invoice || invoice.status === 'PAID') throw new Error("Fatura não encontrada ou já paga.");

      // 1. Busca ou cria a Categoria Padrão do Sistema "Pagamento de Fatura"
      let category = await tx.category.findFirst({ where: { userId: session.user.id, name: 'Pagamento de Fatura' } });
      if (!category) {
        category = await tx.category.create({ data: { name: 'Pagamento de Fatura', type: 'EXPENSE', userId: session.user.id, icon: '💳' } });
      }

      // 2. Cria a Transação de Saída na Conta Corrente
      // 2. Cria a Transação de Saída na Conta Corrente
      const paymentTx = await tx.transaction.create({
        data: {
          userId: session.user?.id,
          description: `Pagamento Fatura ${invoice.creditCard.name} (${invoice.month}/${invoice.year})`,
          amount: -Math.abs(amount),
          date: new Date(),
          type: 'TRANSFER', // <-- MUDOU DE EXPENSE PARA TRANSFER
          accountId,
          categoryId: category.id,
          status: 'CONFIRMED'
        }
      });

      // 3. Quita a Fatura
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paymentTransactionId: paymentTx.id }
      });

      // 4. Debita o Saldo da Conta
      await tx.bankAccount.update({
        where: { id: accountId },
        data: { initialBalance: { decrement: amount } }
      });
    });

    revalidatePath('/cards');
    revalidatePath(`/cards/${cardId}`);
    revalidatePath('/');
    return { success: true, message: "Fatura paga com sucesso!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Erro ao processar pagamento." };
  }
}