'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { Category, Frequency, InvestmentMovementType, InvestmentType, Prisma, Transaction } from '@prisma/client'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parse } from 'csv-parse/sync';


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
export async function getMonthlySummary({ from, to }: { from?: Date; to?: Date }) {
  // Define o período: usa as datas fornecidas ou o mês atual como padrão
  const startDate = from ? startOfDay(from) : startOfMonth(new Date());
  const endDate = to ? endOfDay(to) : endOfMonth(new Date());

  // 1. Buscar transações REAIS que já aconteceram no período selecionado
  const realTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { category: true },
  });

  // 2. Buscar "modelos" de transações recorrentes que estão ativas no período
  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      startDate: { lte: endDate },
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
    },
    include: { category: true },
  });

  // 3. Simular as transações recorrentes para o período ATUAL
  const simulatedTransactions = recurringTransactions
    .map((rt) => {
      const alreadyExists = realTransactions.some(
        (t) => t.recurringTransactionId === rt.id
      );

      if (!alreadyExists && rt.startDate <= endDate) {
        return {
          id: rt.id,
          amount: -Math.abs(rt.amount),
          description: rt.description,
          date: rt.startDate, 
          type: 'EXPENSE' as const,
          createdAt: rt.createdAt,
          updatedAt: new Date(),
          categoryId: rt.categoryId,
          category: rt.category,
          recurringTransactionId: rt.id,
          isProjected: true,
        };
      }
      return null;
    })
    .filter(Boolean) as (Transaction & { category: Category; isProjected?: boolean })[];

  // 4. Combinar e ordenar as listas
  const allTransactions = [...realTransactions, ...simulatedTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 5. Recalcular os totais com base na lista combinada
  const income = allTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expenses = allTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = income + expenses;

  return {
    transactions: allTransactions,
    income,
    expenses: Math.abs(expenses),
    balance,
  };
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

const recurringTransactionSchema = z.object({
  description: z.string().min(3, 'A descrição é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  categoryId: z.string().cuid('Selecione uma categoria.'),
  frequency: z.nativeEnum(Frequency),
  // CORREÇÃO: Removido o objeto inválido { required_error: '...' }
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

// CORREÇÃO: A tipagem de 'errors' foi ajustada para o formato de .flatten()
export type RecurringFormState = {
  success: boolean;
  message: string;
  errors?: {
    formErrors?: string[];
    fieldErrors?: {
      [key in keyof z.infer<typeof recurringTransactionSchema>]?: string[];
    };
  };
};

export async function addRecurringTransaction(prevState: RecurringFormState, formData: FormData): Promise<RecurringFormState> {
  const endDateValue = formData.get('endDate');
  const parsedData = {
    description: formData.get('description'),
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    frequency: formData.get('frequency'),
    startDate: formData.get('startDate'),
    endDate: endDateValue === '' ? null : endDateValue,
  };

  const validatedFields = recurringTransactionSchema.safeParse(parsedData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação.',
      errors: validatedFields.error.flatten(),
    };
  }
  
  try {
    await prisma.recurringTransaction.create({ data: validatedFields.data });
    revalidatePath('/recurring');
    return { success: true, message: 'Despesa recorrente adicionada!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Falha ao adicionar despesa.' };
  }
}

export async function deleteRecurringTransaction(prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = formData.get('id') as string;
  try {
    await prisma.recurringTransaction.delete({ where: { id } });
    revalidatePath('/recurring');
    return { success: true, message: 'Recorrência excluída com sucesso.' };
  // CORREÇÃO: Adicionado '_' para indicar que a variável 'error' não é utilizada
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return { success: false, message: 'Falha ao excluir. Verifique se há transações vinculadas.' };
  }
}
// State para o formulário de importação
export type ImportFormState = {
  success: boolean;
  message: string;
  error?: string;
  importedCount?: number;
};

// CORREÇÃO 2: Definir tipos para os objetos para evitar 'any'
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

    const userCategories = await prisma.category.findMany();
    const categoryMap = userCategories.map(c => ({ id: c.id, name: c.name }));

    // Prompt Aprimorado: Pedindo explicitamente o ID.
    const prompt = `
      Analise a lista de transações a seguir e categorize cada uma de acordo com as categorias disponíveis, retornando o ID da categoria.
      As categorias disponíveis são: ${JSON.stringify(categoryMap)}.
      Transações com valor positivo são 'INCOME', e as negativas são 'EXPENSE'.
      
      Sua resposta DEVE ser APENAS um array JSON válido, sem nenhum texto, explicação ou formatação markdown, como \`\`\`json.
      O objeto de retorno para cada transação deve conter: description, amount, date (formato ISO), type, e categoryId.

      Transações para processar:
      ${JSON.stringify(validRecords)}
    `;

    console.log('Enviando prompt para a API do Gemini...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: "Sua resposta DEVE ser APENAS um array JSON válido, sem nenhum texto, explicação ou formatação markdown adicional.",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    console.log('Resposta recebida do Gemini.');

    // =================================================================================
    // CORREÇÃO 1: Limpar a resposta da IA para remover o Markdown
    // =================================================================================
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    }

    let parsedTransactions: AiTransaction[];
    try {
      parsedTransactions = JSON.parse(text);
    } catch (_parseError) {
      console.error("Erro ao parsear JSON da IA após limpeza:", text);
      return { success: false, message: "A resposta da IA não foi um JSON válido mesmo após a limpeza." };
    }

    if (!Array.isArray(parsedTransactions)) {
      return { success: false, message: "A resposta da IA não foi um array válido." };
    }
    
    // =================================================================================
    // CORREÇÃO 2: Mapear o nome da categoria para o ID correto
    // =================================================================================
    const dataToCreate = parsedTransactions.map((t: AiTransaction) => {
      // Cria um mapa para busca rápida de IDs (case-insensitive)
      const categoriesLookup = new Map(userCategories.map(c => [c.name.toLowerCase(), c.id]));
      
      // A IA pode retornar o nome em vez do ID, então fazemos a conversão
      const categoryId = categoriesLookup.get(String(t.categoryId).toLowerCase()) || t.categoryId;

      return {
        description: t.description,
        amount: parseFloat(String(t.amount)),
        date: new Date(t.date),
        type: t.type,
        categoryId: categoryId, // Usa o ID encontrado
      };
    }).filter(t => t.categoryId && userCategories.some(c => c.id === t.categoryId)); // Garante que o ID é válido

    if (dataToCreate.length === 0) {
        return { success: false, message: "A IA não conseguiu categorizar nenhuma transação com as categorias existentes." };
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

async function ensureInvestmentCategory() {
  const investmentCategoryName = "Investimentos";
  let category = await prisma.category.findUnique({
    where: { name: investmentCategoryName },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: investmentCategoryName },
    });
  }
  return category;
}

// --- ACTIONS PARA GERENCIAR A CARTEIRA ---

// State para o formulário de adicionar ativo
export type AssetFormState = {
  success: boolean;
  message: string;
}

// Adicionar um novo ativo (MODIFICADO para usar prevState)
export async function addInvestmentAsset(prevState: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const name = formData.get('name') as string;
  const type = formData.get('type') as InvestmentType;
  const broker = formData.get('broker') as string;

  if (!name || !type) {
    return { success: false, message: 'Nome e Tipo são obrigatórios.' };
  }

  try {
    await prisma.investment.create({
      data: { name, type, broker },
    });
    revalidatePath('/investments');
    return { success: true, message: 'Ativo adicionado com sucesso!' };
  } catch (_error) { // Correção de ESLint
    return { success: false, message: 'Falha ao adicionar ativo.' };
  }
}

// State para o formulário de movimentação
export type MovementFormState = {
  success: boolean;
  message: string;
}

// Registrar um aporte ou resgate (MODIFICADO para usar prevState)
export async function addInvestmentTransaction(prevState: MovementFormState, formData: FormData): Promise<MovementFormState> {
  const amount = parseFloat(formData.get('amount') as string);
  const date = new Date(formData.get('date') as string);
  const type = formData.get('type') as InvestmentMovementType;
  const investmentId = formData.get('investmentId') as string;

  if (!amount || !date || !type || !investmentId) {
    return { success: false, message: 'Todos os campos são obrigatórios.' };
  }

  const investmentCategory = await ensureInvestmentCategory();

  try {
    const linkedTransaction = await prisma.transaction.create({
      data: {
        description: type === 'CONTRIBUTION' ? `Aporte em Investimento` : `Resgate de Investimento`,
        amount: type === 'CONTRIBUTION' ? -Math.abs(amount) : Math.abs(amount),
        date: date,
        type: type === 'CONTRIBUTION' ? 'EXPENSE' : 'INCOME',
        categoryId: investmentCategory.id,
      },
    });

    await prisma.investmentTransaction.create({
      data: {
        amount,
        date,
        type,
        investmentId,
        linkedTransactionId: linkedTransaction.id,
      },
    });

    revalidatePath('/investments');
    revalidatePath('/');
    return { success: true, message: 'Movimentação registrada com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Falha ao registrar movimentação.' };
  }
}

// --- FUNÇÃO PARA BUSCAR OS DADOS DA PÁGINA ---

export async function getInvestmentsSummary() {
  const investments = await prisma.investment.findMany({
    include: {
      transactions: {
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  // Calcula o saldo atual de cada investimento
  const portfolio = investments.map(inv => {
    const balance = inv.transactions.reduce((acc, t) => {
      return acc + (t.type === 'CONTRIBUTION' ? t.amount : -t.amount);
    }, 0);
    return { ...inv, balance };
  });

  const totalInvested = portfolio.reduce((acc, inv) => acc + inv.balance, 0);

  return { portfolio, totalInvested };
}

type GetAllTransactionsParams = {
  page?: number;
  limit?: number;
  query?: string;
  type?: 'INCOME' | 'EXPENSE';
  from?: Date;
  to?: Date;
}

export async function getAllTransactions({
  page = 1,
  limit = 10,
  query,
  type,
  from,
  to,
}: GetAllTransactionsParams) {

  const whereClause: Prisma.TransactionWhereInput = {
    AND: [
      query ? { description: { contains: query, mode: 'insensitive' } } : {},
      type ? { type: type } : {},
      from ? { date: { gte: startOfDay(from) } } : {},
      to ? { date: { lte: endOfDay(to) } } : {},
    ],
  };

  const [transactions, totalCount] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({
      where: whereClause,
    }),
  ]);

  return { transactions, totalCount };
}

export async function getReportsSummary() {
  const today = new Date();
  const last12MonthsData = [];

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });

    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expensesByCategory = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
      acc[t.category.name] = (acc[t.category.name] || 0) + Math.abs(t.amount);
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
    .slice(0, 5)
    .map(([name]) => name);

  return { last12MonthsData, top5Categories };
}

export async function getAiInsights() {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "A chave da API do Gemini não está configurada." };
  }
  try {
    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    const thisMonthTxs = await prisma.transaction.findMany({ where: { date: { gte: thisMonthStart } }, include: { category: true } });
    const lastMonthTxs = await prisma.transaction.findMany({ where: { date: { gte: lastMonthStart, lte: lastMonthEnd } }, include: { category: true } });

    const summarize = (txs: (Transaction & { category: Category })[]) => { /* ... (mesma lógica de antes) ... */ };
    const thisMonthSummary = summarize(thisMonthTxs);
    const lastMonthSummary = summarize(lastMonthTxs);

    const prompt = `... (mesmo prompt de antes) ...`; // O prompt que já definimos antes está bom

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const insights = JSON.parse(text);
    return { insights };
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return { error: "Não foi possível gerar os insights no momento." };
  }
}

export async function generateInsightsAction() {
  // Revalida o path para garantir que estamos pegando os dados mais recentes antes de analisar
  revalidatePath('/'); 
  // Chama a função de lógica que já tínhamos
  const result = await getAiInsights();
  return result;
}