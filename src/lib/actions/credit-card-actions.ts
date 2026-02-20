'use server';

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const creditCardSchema = z.object({
  name: z.string().min(2, "O nome do cartão deve ter pelo menos 2 caracteres"),
  limit: z.coerce.number().positive("O limite deve ser um número positivo"),
  closingDay: z.coerce.number().min(1, "Dia inválido").max(31, "Dia inválido"),
  dueDay: z.coerce.number().min(1, "Dia inválido").max(31, "Dia inválido"),
  brand: z.string().optional(),
  defaultAccountId: z.string().optional(),
});

export async function createCreditCard(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  const rawData = Object.fromEntries(formData.entries());
  const validated = creditCardSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, message: "Dados inválidos: " + validated.error.issues[0].message };
  }

  const { defaultAccountId, ...data } = validated.data;

  try {
    await prisma.creditCard.create({
      data: {
        ...data,
        userId: session.user.id,
        defaultAccountId: defaultAccountId && defaultAccountId !== "none" ? defaultAccountId : null,
      },
    });

    revalidatePath("/cards");
    return { success: true, message: "Cartão de crédito adicionado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar cartão de crédito." };
  }
}

export async function getCreditCards() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const cards = await prisma.creditCard.findMany({
    where: { userId: session.user.id },
    include: { 
      defaultAccount: true, 
      // Trazemos as faturas em aberto para calcular o limite consumido
      invoices: {
        where: { status: { not: 'PAID' } },
        select: { amount: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calcula e envia o limite disponível pronto para o frontend
  return cards.map(card => {
    const usedLimit = card.invoices.reduce((acc, inv) => acc + inv.amount, 0);
    return {
      ...card,
      usedLimit,
      availableLimit: card.limit - usedLimit
    };
  });
}

export async function deleteCreditCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  try {
    // Usamos uma transação para garantir que tudo seja apagado ou nada seja
    await prisma.$transaction(async (tx) => {
      // 1. Apagar as transações das faturas deste cartão
      await tx.transaction.deleteMany({
        where: { invoice: { cardId: id } }
      });

      // 2. Apagar as faturas
      await tx.invoice.deleteMany({
        where: { cardId: id }
      });

      // 3. Finalmente apagar o cartão
      await tx.creditCard.delete({
        where: { id, userId: session.user.id }
      });
    });

    revalidatePath("/cards");
    return { success: true, message: "Cartão e dados vinculados excluídos." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro técnico ao excluir o cartão." };
  }
}