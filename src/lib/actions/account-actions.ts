'use server';

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "WALLET"]),
  initialBalance: z.coerce.number(), // coerce transforma string do input em number
  color : z.string().optional(),
});

export async function createBankAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  // Parse dos dados
  const rawData = Object.fromEntries(formData.entries());
  const validated = accountSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, message: "Dados inválidos: " + validated.error.issues[0].message };
  }

  try {
    await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        name: validated.data.name,
        type: validated.data.type,
        initialBalance: validated.data.initialBalance,
        color: validated.data.color,
        currency: "BRL"
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, message: "Conta criada com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar conta no banco." };
  }
}

export async function getBankAccounts(includeArchived = false) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.bankAccount.findMany({
    where: { 
      userId: session.user.id,
      isArchived: includeArchived ? undefined : false 
    },
    orderBy: { createdAt: 'desc' },
    include: {
        _count: { select: { transactions: true } }
    }
  });
}

const editAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Nome muito curto"),
  color: z.string().optional(),
});

export async function updateBankAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  const rawData = Object.fromEntries(formData.entries());
  const validated = editAccountSchema.safeParse(rawData);

  if (!validated.success) return { success: false, message: "Dados inválidos" };

  try {
    await prisma.bankAccount.update({
      where: { id: validated.data.id, userId: session.user.id },
      data: { name: validated.data.name, color: validated.data.color },
    });
    revalidatePath("/accounts");
    return { success: true, message: "Conta atualizada com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao atualizar conta." };
  }
}

export async function archiveBankAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  try {
    await prisma.bankAccount.update({
      where: { id, userId: session.user.id },
      data: { isArchived: true },
    });
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, message: "Conta arquivada com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao arquivar conta." };
  }
}

export async function adjustAccountBalance(accountId: string, newBalance: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  try {
    // Segurança extra: Verifica se a conta pertence ao usuário logado
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId, userId: session.user.id }
    });

    if (!account) return { success: false, message: "Conta não encontrada" };

    await prisma.bankAccount.update({
      where: { id: accountId },
      data: { initialBalance: newBalance }
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, message: "Saldo ajustado com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao ajustar saldo." };
  }
}