'use server';

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "WALLET"]),
  initialBalance: z.coerce.number(), // coerce transforma string do input em number
});

export async function createBankAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Não autorizado" };

  // Parse dos dados
  const rawData = Object.fromEntries(formData.entries());
  const validated = accountSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, message: "Dados inválidos: " + validated.error.errors[0].message };
  }

  try {
    await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        name: validated.data.name,
        type: validated.data.type,
        initialBalance: validated.data.initialBalance,
        currency: "BRL"
      },
    });

    revalidatePath("/accounts"); // Atualiza a página automaticamente
    return { success: true, message: "Conta criada com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar conta no banco." };
  }
}

export async function getBankAccounts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.bankAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
        _count: { select: { transactions: true } }
    }
  });
}