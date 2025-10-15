// file: src/app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { endOfMonth, startOfMonth } from 'date-fns';

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória.'),
  amount: z.number().positive('O valor deve ser positivo.'),
  date: z.string().datetime(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().cuid('Categoria inválida.'),
});

// GET: Buscar transações do mês atual
export async function GET() {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json(transactions);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao buscar transações.' }, { status: 500 });
  }
}

// POST: Criar uma nova transação
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = transactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { amount, ...data } = validation.data;

    const newTransaction = await prisma.transaction.create({
      data: {
        ...data,
        // Garante que despesas sejam salvas como negativas
        amount: data.type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount),
        date: new Date(data.date),
      },
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha ao criar transação.' }, { status: 500 });
  }
}