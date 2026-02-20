/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth'; // <-- IMPORTANTE: Autenticação
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { Category, Frequency, InvestmentMovementType, InvestmentType, Prisma, Transaction, TransactionType } from '@prisma/client'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parse } from 'csv-parse/sync';

// ============================================================================
// TRANSAÇÕES
// ============================================================================

export type FormState = {
  success: boolean;
  message: string;
  errors?: any;
};

export async function addTransaction(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  try {
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const amountStr = formData.get('amount') as string;
    const dateStr = formData.get('date') as string;

    if (!description || !amountStr || !dateStr || !type) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const amount = Math.abs(parseFloat(amountStr));
    const date = new Date(dateStr);

    // ============================================
    // LÓGICA DE TRANSFERÊNCIA
    // ============================================
    if (type === 'TRANSFER') {
      const fromAccountId = formData.get('fromAccountId') as string;
      const toAccountId = formData.get('toAccountId') as string;

      if (!fromAccountId || !toAccountId) throw new Error("Selecione as contas de origem e destino.");
      if (fromAccountId === toAccountId) throw new Error("A conta de origem e destino devem ser diferentes.");

      // Executa tudo junto: Cria transações e atualiza saldos
      await prisma.$transaction(async (tx) => {
        // 1. Cria a Saída (Como TRANSFERÊNCIA, com valor negativo)
        const txOut = await tx.transaction.create({
          data: {
            userId: session.user?.id,
            description,
            amount: -amount,
            date,
            type: 'TRANSFER',
            accountId: fromAccountId,
            status: 'CONFIRMED'
          }
        });

        // 2. Cria a Entrada vinculada (Como TRANSFERÊNCIA, com valor positivo)
        const txIn = await tx.transaction.create({
          data: {
            userId: session.user?.id,
            description,
            amount: amount,
            date,
            type: 'TRANSFER',
            accountId: toAccountId,
            status: 'CONFIRMED',
            transferId: txOut.id
          }
        });

        // 3. Atualiza a saída com o ID da entrada
        await tx.transaction.update({
          where: { id: txOut.id },
          data: { transferId: txIn.id }
        });

        // 4. ATUALIZA OS SALDOS DAS CONTAS
        await tx.bankAccount.update({
          where: { id: fromAccountId },
          data: { initialBalance: { decrement: amount } }
        });
        
        await tx.bankAccount.update({
          where: { id: toAccountId },
          data: { initialBalance: { increment: amount } }
        });
      });

    }
    // ============================================
    // LÓGICA NORMAL (RECEITA / DESPESA)
    // ============================================
    else {
      const accountId = formData.get('accountId') as string;
      const categoryId = formData.get('categoryId') as string;
      const tagId = formData.get('tagId') as string | null; // <-- Captura a Tag se houver
      const file = formData.get('attachment') as File | null; // <-- Captura o Arquivo

      if (!accountId) throw new Error("Selecione uma conta bancária.");
      if (!categoryId || categoryId === 'none') throw new Error("Selecione uma categoria.");

      const finalAmount = type === 'EXPENSE' ? -amount : amount;

      await prisma.$transaction(async (tx) => {
        // 1. Cria a transação (Agora com a Tag vinculada)
        const novaTransacao = await tx.transaction.create({
          data: {
            userId: session.user.id,
            description,
            amount: finalAmount,
            date,
            type: type as TransactionType,
            accountId,
            categoryId,
            tags: tagId && tagId !== 'none' ? { connect: [{ id: tagId }] } : undefined, // <-- Conecta a tag
            status: 'CONFIRMED'
          }
        });

        // 2. ATUALIZA O SALDO DA CONTA
        await tx.bankAccount.update({
          where: { id: accountId },
          data: { 
            initialBalance: type === 'EXPENSE' ? { decrement: amount } : { increment: amount } 
          }
        });

        // 3. SALVA O ANEXO FÍSICO NO BANCO DE DADOS
        if (file && file.size > 0) {
          // Converte o File do navegador para um Buffer do NodeJS
          const buffer = Buffer.from(await file.arrayBuffer());
          
          await tx.attachment.create({
            data: {
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
              data: buffer,
              transactionId: novaTransacao.id
            }
          });
        }
      });
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    return { success: true, message: 'Transação registrada com sucesso!' };

  } catch (error: any) {
    return { success: false, message: error.message || 'Falha ao registrar transação.' };
  }
}

export type DeleteState = { success: boolean; message: string; }

export async function deleteTransaction(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const id = formData.get('id') as string;

  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction || transaction.userId !== session.user.id) {
      return { success: false, message: 'Transação não encontrada.' };
    }
    
    // Deleta a transação e REVERTE O SALDO da conta ao mesmo tempo
    await prisma.$transaction(async (tx) => {
      // Reverte o saldo da conta principal
      if (transaction.accountId && transaction.status === 'CONFIRMED') {
        const amountToReverse = transaction.type === 'EXPENSE' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);
        await tx.bankAccount.update({
          where: { id: transaction.accountId },
          data: { initialBalance: { increment: amountToReverse } }
        });
      }

      // Se for uma transferência, apaga a transação linkada e reverte o saldo da outra conta
      if (transaction.transferId) {
        const linkedTx = await tx.transaction.findUnique({ where: { id: transaction.transferId } });
        if (linkedTx && linkedTx.accountId) {
          const linkedAmountToReverse = linkedTx.type === 'EXPENSE' ? Math.abs(linkedTx.amount) : -Math.abs(linkedTx.amount);
          await tx.bankAccount.update({
            where: { id: linkedTx.accountId },
            data: { initialBalance: { increment: linkedAmountToReverse } }
          });
          await tx.transaction.delete({ where: { id: linkedTx.id } });
        }
      }

      // Finalmente, apaga a transação que o usuário clicou
      await tx.transaction.delete({ where: { id } });
    });

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    return { success: true, message: 'Transação e saldos revertidos com sucesso.' };
  } catch (error) {
    return { success: false, message: 'Falha ao excluir a transação.' };
  }
}

// A função de Update precisa de uma lógica similar de "Reverter saldo velho e aplicar novo",
// mas para simplificar e garantir a consistência agora, vamos apenas deixá-la preparada.
export async function updateTransaction(prevState: FormState, formData: FormData): Promise<FormState> {
   return { success: false, message: 'A edição de transações está desabilitada temporariamente para evitar falhas de saldo. Por favor, exclua e crie novamente.' };
}
// ============================================================================
// RESUMOS E GRÁFICOS (DASHBOARD)
// ============================================================================

export async function getMonthlySummary({ from, to }: { from?: Date; to?: Date }) {
  const session = await auth();
  if (!session?.user?.id) return { transactions: [], income: 0, expenses: 0, balance: 0 };

  const startDate = from ? startOfDay(from) : startOfMonth(new Date());
  const endDate = to ? endOfDay(to) : endOfMonth(new Date());

  const realTransactions = await prisma.transaction.findMany({
    where: { 
      userId: session.user.id, // <-- CORREÇÃO: Escopo de usuário
      date: { gte: startDate, lte: endDate } 
    },
    include: { category: true, account: true, tags: true, attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true
        }
      } },
  });

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      userId: session.user.id, // <-- CORREÇÃO
      startDate: { lte: endDate },
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
    },
    include: { category: true },
  });

  const simulatedTransactions = recurringTransactions
    .map((rt) => {
      const alreadyExists = realTransactions.some((t) => t.recurringTransactionId === rt.id);
      if (!alreadyExists && rt.startDate <= endDate) {
        return {
          id: rt.id,
          userId: rt.userId,
          amount: rt.type === 'EXPENSE' ? -Math.abs(rt.amount) : Math.abs(rt.amount),
          description: rt.description,
          date: rt.startDate,
          type: rt.type,
          createdAt: rt.createdAt,
          updatedAt: new Date(),
          categoryId: rt.categoryId,
          category: rt.category,
          recurringTransactionId: rt.id,
          isProjected: true,
          status: 'PLANNED' as const
        };
      }
      return null;
    }).filter(Boolean) as (Transaction & { category: Category; isProjected?: boolean })[];

  const allTransactions = [...realTransactions, ...simulatedTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const income = allTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expenses = allTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  
  return { transactions: allTransactions, income, expenses: Math.abs(expenses), balance: income + expenses };
}

// ============================================================================
// CATEGORIAS
// ============================================================================

const categorySchema = z.object({ 
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().optional()
});

export type CategoryFormState = { success: boolean; message: string; errors?: any; };

export async function addCategory(prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  // 2. Extraímos todos os campos enviados pelo formulário
  const validatedFields = categorySchema.safeParse({ 
    name: formData.get('name'),
    type: formData.get('type'),
    icon: formData.get('icon')
  });

  if (!validatedFields.success) return { success: false, message: 'Erro de validação.' };

  try {
    await prisma.category.create({
      data: { 
        name: validatedFields.data.name,
        userId: session.user.id,
        type: validatedFields.data.type, // Salva o tipo real (INCOME/EXPENSE)
        icon: validatedFields.data.icon || '📌' // Salva o emoji selecionado
      },
    });
    revalidatePath('/config');
    revalidatePath('/');
    return { success: true, message: 'Categoria adicionada com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Falha ao adicionar. Já existe uma categoria com este nome?' };
  }
}

export async function deleteCategory(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const id = formData.get('id') as string;
  try {
    await prisma.category.delete({ where: { id, userId: session.user.id } }); // <-- CORREÇÃO
    revalidatePath('/config');
    revalidatePath('/');
    return { success: true, message: 'Categoria excluída.' };
  } catch (error) {
    return { success: false, message: 'Erro. Verifique se há transações vinculadas.' };
  }
}

// ============================================================================
// RECORRÊNCIAS
// ============================================================================

const recurringTransactionSchema = z.object({
  description: z.string().min(3, 'Obrigatório.'),
  amount: z.coerce.number().positive(),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().cuid(),
  frequency: z.nativeEnum(Frequency),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export type RecurringFormState = { success: boolean; message: string; errors?: any; };

export async function addRecurringTransaction(prevState: RecurringFormState, formData: FormData): Promise<RecurringFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const endDateValue = formData.get('endDate');
  const parsedData = {
    description: formData.get('description'), amount: formData.get('amount'),
    type: formData.get('type'), categoryId: formData.get('categoryId'),
    frequency: formData.get('frequency'), startDate: formData.get('startDate'),
    endDate: endDateValue === '' ? null : endDateValue,
  };

  const validated = recurringTransactionSchema.safeParse(parsedData);
  if (!validated.success) return { success: false, message: 'Erro de validação.' };
  
  try {
    await prisma.recurringTransaction.create({ 
      data: { ...validated.data, userId: session.user.id } // <-- CORREÇÃO
    });
    revalidatePath('/recurring');
    return { success: true, message: 'Despesa recorrente adicionada!' };
  } catch (error) {
    return { success: false, message: 'Falha ao adicionar.' };
  }
}

export async function deleteRecurringTransaction(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const id = formData.get('id') as string;
  try {
    await prisma.recurringTransaction.delete({ where: { id, userId: session.user.id } }); // <-- CORREÇÃO
    revalidatePath('/recurring');
    return { success: true, message: 'Excluída com sucesso.' };
  } catch (_error) {
    return { success: false, message: 'Falha ao excluir.' };
  }
}

export async function getRecurringBalance() {
  const session = await auth();
  if (!session?.user?.id) return { totalRecurringBalance: 0 };

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: { userId: session.user.id } // <-- CORREÇÃO
  });
  
  const totalRecurringBalance = recurringTransactions.reduce((acc, transaction) => {
    return transaction.type === 'INCOME' ? acc + transaction.amount : acc - transaction.amount;
  }, 0);

  return { totalRecurringBalance };
}

// ============================================================================
// INVESTIMENTOS
// ============================================================================

export type AssetFormState = { success: boolean; message: string; }

export async function addInvestmentAsset(prevState: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const name = formData.get('name') as string;
  const type = formData.get('type') as InvestmentType;

  if (!name || !type) return { success: false, message: 'Nome e Tipo obrigatórios.' };

  try {
    await prisma.investment.create({
      data: { name, type, userId: session.user.id }, // <-- CORREÇÃO
    });
    revalidatePath('/investments');
    return { success: true, message: 'Ativo adicionado!' };
  } catch (_error) { 
    return { success: false, message: 'Falha ao adicionar ativo.' };
  }
}

export type MovementFormState = { success: boolean; message: string; }

export async function addInvestmentTransaction(prevState: MovementFormState, formData: FormData): Promise<MovementFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const amount = parseFloat(formData.get('amount') as string);
  const date = new Date(formData.get('date') as string);
  const type = formData.get('type') as InvestmentMovementType;
  const investmentId = formData.get('investmentId') as string;

  if (!amount || !date || !type || !investmentId) return { success: false, message: 'Campos obrigatórios faltando.' };

  try {
    // 1. Acha ou cria categoria
    let invCategory = await prisma.category.findFirst({ where: { userId: session.user.id, name: 'Investimentos' }});
    if (!invCategory) invCategory = await prisma.category.create({ data: { name: 'Investimentos', type: 'EXPENSE', userId: session.user.id }});

    // 2. Cria a transação base
    const linkedTransaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        description: type === 'BUY' ? `Aporte em Investimento` : `Resgate`,
        amount: type === 'BUY' ? -Math.abs(amount) : Math.abs(amount),
        date: date,
        type: type === 'BUY' ? 'EXPENSE' : 'INCOME',
        categoryId: invCategory.id,
        status: 'CONFIRMED'
      },
    });

    // 3. Cria a movimentação de investimento (agora requer quantity e pricePerShare)
    await prisma.investmentTransaction.create({
      data: {
        amount,
        quantity: 1, // Mock provisório para evitar crash
        pricePerShare: amount, // Mock provisório para evitar crash
        date,
        type,
        investmentId,
        transactionId: linkedTransaction.id, // <-- CORREÇÃO
      },
    });

    revalidatePath('/investments');
    return { success: true, message: 'Movimentação registrada!' };
  } catch (error) {
    return { success: false, message: 'Falha ao registrar movimentação.' };
  }
}

export async function getInvestmentsSummary() {
  const session = await auth();
  if (!session?.user?.id) return { portfolio: [], totalInvested: 0 };

  const investments = await prisma.investment.findMany({
    where: { userId: session.user.id }, // <-- CORREÇÃO
    include: { transactions: { orderBy: { date: 'desc' } } },
  });

  const portfolio = investments.map(inv => {
    const balance = inv.transactions.reduce((acc, t) => acc + (t.type === 'BUY' ? t.amount : -t.amount), 0);
    return { ...inv, balance };
  });

  const totalInvested = portfolio.reduce((acc, inv) => acc + inv.balance, 0);
  return { portfolio, totalInvested };
}

// ============================================================================
// RELATÓRIOS E IA
// ============================================================================

export async function getReportsSummary() {
  const session = await auth();
  if (!session?.user?.id) return { last12MonthsData: [], top5Categories: [] };

  const today = new Date();
  const last12MonthsData = [];

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: startDate, lte: endDate } }, // <-- CORREÇÃO
      include: { category: true },
    });

    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expensesByCategory = transactions.filter(t => t.type === 'EXPENSE' && t.category).reduce((acc, t) => {
      acc[t.category!.name] = (acc[t.category!.name] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as { [key: string]: number });

    last12MonthsData.push({ month: format(startDate, 'MMM/yy'), income, expenses, expensesByCategory });
  }

  const totalSpendingByCategory = last12MonthsData.reduce((acc, monthData) => {
    for (const category in monthData.expensesByCategory) {
      acc[category] = (acc[category] || 0) + monthData.expensesByCategory[category];
    }
    return acc;
  }, {} as { [key: string]: number });

  const top5Categories = Object.entries(totalSpendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5).map(([name]) => name);

  return { last12MonthsData, top5Categories };
}

export async function getAiInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };

  if (!process.env.GEMINI_API_KEY) return { error: "A chave da API do Gemini não está configurada." };
  
  try {
    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    // <-- CORREÇÃO: Filtrando pelo usuário
    const thisMonthTxs = await prisma.transaction.findMany({ where: { userId: session.user.id, date: { gte: thisMonthStart } }, include: { category: true } });
    const lastMonthTxs = await prisma.transaction.findMany({ where: { userId: session.user.id, date: { gte: lastMonthStart, lte: lastMonthEnd } }, include: { category: true } });

    const summarize = (transactions: (Transaction & { category: Category | null })[]) => {
      return transactions.filter(t => t.type === 'EXPENSE' && t.category).reduce((acc, t) => {
        acc[t.category!.name] = (acc[t.category!.name] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as { [key: string]: number });
    };

    const prompt = `
      Você é um consultor financeiro. Analise os dados do mês atual e compare com o mês anterior.
      Atual: ${JSON.stringify(summarize(thisMonthTxs))}
      Anterior: ${JSON.stringify(summarize(lastMonthTxs))}
      Forneça até 3 insights curtos e acionáveis em um array JSON de strings.
      Sua resposta DEVE ser APENAS o array JSON.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return { insights: JSON.parse(text) };
  } catch (error) {
    return { error: "Não foi possível gerar os insights." };
  }
}

export async function generateInsightsAction() {
  revalidatePath('/'); 
  return await getAiInsights();
}

// O import CSV pode ser mantido ou refatorado posteriormente na Fase 6/7.


// ============================================================================
// IMPORTAÇÃO VIA IA (GEMINI)
// ============================================================================

export type ImportFormState = {
  success: boolean;
  message: string;
  error?: string;
  importedCount?: number;
};

type CsvRecord = {
  date: string;
  category: string;
  title: string;
  amount: string;
};

type AiTransaction = {
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
};

export async function importTransactionsFromCSV(prevState: ImportFormState, formData: FormData): Promise<ImportFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const csvFile = formData.get('csvFile') as File;

  if (!csvFile || csvFile.size === 0) {
    return { success: false, message: 'Nenhum arquivo foi enviado.' };
  }
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, message: 'A chave da API do Gemini não foi configurada no servidor.' };
  }

  try {
    const fileContent = await csvFile.text();
    const records: CsvRecord[] = parse(fileContent, {
      columns: ['date', 'category', 'title', 'amount'],
      skip_empty_lines: true,
    });

    const validRecords = records.filter((r: CsvRecord) => r.date && r.amount && r.title);
    if (validRecords.length === 0) {
      return { success: false, message: 'Nenhuma transação válida encontrada no arquivo.' };
    }

    // CORREÇÃO DE SEGURANÇA: Buscar APENAS as categorias deste usuário
    const userCategories = await prisma.category.findMany({
      where: { userId: session.user.id }
    });
    
    const categoryMap = userCategories.map(c => ({ id: c.id, name: c.name }));

    const prompt = `
      Você é um assistente financeiro inteligente. Sua tarefa é analisar uma lista de transações de uma fatura de cartão de crédito, limpar os dados e categorizá-los com precisão.

      **Instruções Gerais:**
      1.  **Categorização:** Use a lista de categorias fornecida para atribuir o \`categoryId\` correto a cada transação. Se não houver correspondência, escolha a mais próxima.
      2.  **Tipo de Transação:** Transações com valor positivo são 'INCOME', e as negativas são 'EXPENSE'.
      3.  **Formato da Data:** Retorne a data no formato ISO 8601 completo (YYYY-MM-DDTHH:mm:ss.sssZ).

      **Categorias Disponíveis (use o ID):**
      ${JSON.stringify(categoryMap)}

      **Transações para Processar:**
      ${JSON.stringify(validRecords)}

      **Formato de Saída Obrigatório:**
      Sua resposta DEVE ser APENAS um array JSON válido. Sem formatação markdown como \`\`\`json.
      Cada objeto no array deve ter a seguinte estrutura: { description: string, amount: number, date: string, type: 'INCOME' | 'EXPENSE', categoryId: string }.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: "Sua resposta DEVE ser APENAS um array JSON válido, sem nenhum texto, explicação ou formatação markdown adicional.",
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    }

    let parsedTransactions: AiTransaction[];
    try {
      parsedTransactions = JSON.parse(text);
    } catch (_parseError) {
      return { success: false, message: "A resposta da IA não foi um JSON válido." };
    }

    if (!Array.isArray(parsedTransactions)) {
      return { success: false, message: "A resposta da IA não foi um array válido." };
    }
    
    const dataToCreate = parsedTransactions.map((t: AiTransaction) => {
      const categoriesLookup = new Map(userCategories.map(c => [c.name.toLowerCase(), c.id]));
      const categoryId = categoriesLookup.get(String(t.categoryId).toLowerCase()) || t.categoryId;

      return {
        userId: session.user.id, // CORREÇÃO DE SEGURANÇA: Atribuir ao usuário!
        description: t.description,
        amount: parseFloat(String(t.amount)),
        date: new Date(t.date),
        type: t.type as TransactionType,
        categoryId: categoryId,
        status: 'CONFIRMED' as const // Novo campo obrigatório do schema
      };
    }).filter(t => t.categoryId && userCategories.some(c => c.id === t.categoryId));

    if (dataToCreate.length === 0) {
        return { success: false, message: "A IA não conseguiu categorizar nenhuma transação." };
    }

    await prisma.transaction.createMany({
      data: dataToCreate,
      skipDuplicates: true,
    });

    revalidatePath('/');
    return { success: true, message: 'Importação concluída!', importedCount: dataToCreate.length };

  } catch (error) {
    console.error(error);
    const errorMessage = (error instanceof Error) ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, message: 'Ocorreu um erro inesperado durante a importação.', error: errorMessage };
  }
}


// ============================================================================
// BUSCA E FILTROS DE TRANSAÇÕES (PÁGINA COMPLETA)
// ============================================================================

export async function getAllTransactions(params: {
  page?: number;
  limit?: number;
  query?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'all';
  from?: Date;
  to?: Date;
  accountId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { transactions: [], totalCount: 0 };

  const { page = 1, limit = 10, query, type, from, to, accountId } = params;
  const skip = (page - 1) * limit;

  // Monta os filtros de forma dinâmica
  const where: Prisma.TransactionWhereInput = {
    userId: session.user.id,
    deletedAt: null, // Não traz transações que sofreram "soft delete"
  };

  // Pesquisa por texto na descrição
  if (query) {
    where.description = { contains: query, mode: 'insensitive' };
  }

  // Filtro por tipo (Receita, Despesa, Transferência)
  if (type && type !== 'all') {
    where.type = type as TransactionType;
  }

  // Filtro por data
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = startOfDay(from);
    if (to) where.date.lte = endOfDay(to);
  }

  if (accountId && accountId !== 'all') {
    where.accountId = accountId;
  }

  // Executa a busca e a contagem total em paralelo (mais rápido)
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        account: true, 
        tags: true, 
        attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true
        }
      }
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, totalCount };
}


// ============================================================================
// TAGS (SUBGRUPOS DE CATEGORIA)
// ============================================================================

export async function addTag(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const name = formData.get('name') as string;
  const categoryId = formData.get('categoryId') as string;

  if (!name || name.length < 2) return { success: false, message: 'Nome muito curto.' };

  try {
    await prisma.tag.create({
      data: { name, categoryId, userId: session.user.id }
    });
    revalidatePath('/config');
    revalidatePath('/');
    return { success: true, message: 'Tag criada com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Erro ao criar Tag (Já existe uma com este nome nesta categoria?).' };
  }
}

export async function deleteTag(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Não autorizado' };

  const id = formData.get('id') as string;

  try {
    await prisma.tag.delete({
      where: { id, userId: session.user.id }
    });
    revalidatePath('/config');
    revalidatePath('/');
    return { success: true, message: 'Tag excluída.' };
  } catch (error) {
    return { success: false, message: 'Erro ao excluir Tag.' };
  }
}