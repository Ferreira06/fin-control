'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertBudget(categoryId: string, amount: number, month: number, year: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  try {
    // Upsert: Se já existe um orçamento para esta categoria neste mês/ano, atualiza. Se não, cria.
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: session.user.id,
          categoryId,
          month,
          year
        }
      },
      update: { amount },
      create: {
        userId: session.user.id,
        categoryId,
        amount,
        month,
        year
      }
    });

    revalidatePath("/budgets");
    revalidatePath("/");
    return { success: true, message: "Orçamento salvo!" };
  } catch (error) {
    return { success: false, message: "Erro ao salvar orçamento." };
  }
}

export async function getBudgets(month: number, year: number) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.budget.findMany({
    where: { userId: session.user.id, month, year },
    include: { category: true }
  });
}