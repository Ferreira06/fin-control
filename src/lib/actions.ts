'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Prisma, Transaction } from '@prisma/client'; // Importando o tipo TransactionType

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser um número positivo.'),
  date: z.coerce.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().cuid('Selecione uma categoria.'),
});

export type FormState = {
  success: boolean;
  message: string;
  // CORREÇÃO: O tipo de 'errors' deve corresponder à estrutura de .flatten()
  errors?: {
    formErrors?: string[];
    fieldErrors?: {
      [key in keyof z.infer<typeof transactionSchema>]?: string[];
    };
  };
};

export async function addTransaction(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = transactionSchema.safeParse({
    description: formData.get('description'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    type: formData.get('type'),
    categoryId: formData.get('categoryId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten(),
    };
  }
  
  const { amount, ...data } = validatedFields.data;

  try {
    await prisma.transaction.create({
      data: {
        ...data, // 'data' agora inclui 'description', 'date', 'type', e 'categoryId'
        amount: data.type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
      },
    });

    revalidatePath('/');
    return { success: true, message: 'Transação adicionada com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Falha ao adicionar transação no banco de dados.' };
  }
}

export async function deleteTransaction(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = formData.get('id') as string;

  try {
    // Busca a transação para verificar se ela existe antes de deletar
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return { success: false, message: 'Transação não encontrada.' };
    }
    
    await prisma.transaction.delete({
      where: { id },
    });

    // Revalida o cache da página principal para atualizar a lista
    revalidatePath('/');

    return { success: true, message: 'Transação excluída com sucesso.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Falha ao excluir a transação.' };
  }
}

const updateTransactionSchema = transactionSchema.extend({
  id: z.string().cuid('ID da transação inválido.'),
});

// Server Action para atualizar uma transação
export async function updateTransaction(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = updateTransactionSchema.safeParse({
    id: formData.get('id'),
    description: formData.get('description'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    type: formData.get('type'),
    categoryId: formData.get('categoryId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação nos dados da transação.',
      errors: validatedFields.error.flatten(),
    };
  }

  const { id, amount, ...data } = validatedFields.data;

  try {
    await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        amount: data.type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
      },
    });

    revalidatePath('/');
    return { success: true, message: 'Transação atualizada com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Falha ao atualizar a transação.' };
  }
}

// O restante do arquivo (getMonthlySummary) permanece como estava, pois já foi corrigido.
export async function getMonthlySummary() {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  // CORREÇÃO: Adicionando tipos explícitos
  const income = transactions
    .filter((t: Transaction) => t.type === 'INCOME')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  // CORREÇÃO: Adicionando tipos explícitos
  const expenses = transactions
    .filter((t: Transaction) => t.type === 'EXPENSE')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const balance = income + expenses;

  return { transactions, income, expenses: Math.abs(expenses), balance };
}

const categorySchema = z.object({
  name: z.string().min(3, 'O nome da categoria deve ter pelo menos 3 caracteres.'),
});

// State para o formulário de categoria
export type CategoryFormState = {
  success: boolean;
  message: string;
  // CORREÇÃO: A tipagem de 'errors' deve corresponder à estrutura de .flatten()
  errors?: {
    formErrors?: string[];
    fieldErrors?: {
      name?: string[];
    };
  };
};

// Server Action para adicionar uma nova categoria
export async function addCategory(prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten(),
    };
  }

  try {
    const { name } = validatedFields.data;
    await prisma.category.create({
      data: { name },
    });

    revalidatePath('/config');
    revalidatePath('/'); // Revalida a página principal também, para o modal ter a nova categoria

    return { success: true, message: `Categoria "${name}" adicionada com sucesso!` };
  } catch (error) {
    // CORREÇÃO: Usar um tipo de erro específico em vez de 'any'
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, message: 'Esta categoria já existe.' };
    }
    return { success: false, message: 'Falha ao adicionar categoria.' };
  }
}

// State para a ação de deletar
export type DeleteState = {
    success: boolean;
    message: string;
}

// Server Action para deletar uma categoria (adaptada para useFormState)
export async function deleteCategory(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = formData.get('id') as string;

  try {
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/config');
    revalidatePath('/'); // Revalida a página principal também

    return { success: true, message: 'Categoria excluída com sucesso.' };
  } catch (error) {
    // CORREÇÃO: Usar um tipo de erro específico em vez de 'any'
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. A categoria possui transações vinculadas.' };
    }
    return { success: false, message: 'Falha ao excluir categoria.' };
  }
}