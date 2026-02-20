import { getAllTransactions } from "@/lib/actions";
import { getBankAccounts } from "@/lib/actions/account-actions";
import { startOfMonth, endOfMonth } from 'date-fns';
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PaginationControls } from "@/components/transactions/PaginationControl";
import { AddTransactionModal } from "@/components/shared/AddTransactionalModal";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCreditCards } from "@/lib/actions/credit-card-actions";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const searchParams = await props.searchParams;

  const page = parseInt(searchParams.page as string) || 1;
  const limit = parseInt(searchParams.limit as string) || 10;
  const query = searchParams.query as string;
  const type = searchParams.type as 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'all' | undefined;
  const accountId = searchParams.account as string | undefined;

  // 2. LOGICA DE PADRÃO: Se não houver 'from' ou 'to', usa o mês atual
  const from = searchParams.from 
    ? new Date(searchParams.from as string) 
    : startOfMonth(new Date()); // Começo do mês hoje
    
  const to = searchParams.to 
    ? new Date(searchParams.to as string) 
    : endOfMonth(new Date());   // Fim do mês hoje

  const [
    { transactions, totalCount },
    categories,
    accounts,
    cards
  ] = await Promise.all([
    // Passamos 'from' e 'to' que agora sempre terão um valor
    getAllTransactions({ page, limit, query, type, from, to, accountId }), 
    prisma.category.findMany({ where: { userId: session.user.id } }),
    getBankAccounts(false),
    getCreditCards()
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const safeTransactions = transactions.map(t => ({
    ...t,
    category: t.category || {
      id: 'uncategorized',
      userId: session.user?.id,
      name: t.type === 'TRANSFER' ? 'Transferência' : 'Sem Categoria',
      icon: t.type === 'TRANSFER' ? '🔄' : '❓',
      type: t.type
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Todas as Transações</h1>
          <p className="text-muted-foreground">Visualize, filtre e gerencie seu histórico completo.</p>
        </div>
        <AddTransactionModal categories={categories} accounts={accounts} cards={cards}/>
      </header>

      {/* Barra de Filtros */}
      <TransactionFilters accounts={accounts} />

      {/* ... Tabela e Paginação continuam igual ... */}
      <div className="mt-8 border rounded-xl overflow-hidden bg-card shadow-sm">
        <TransactionsTable transactions={safeTransactions} categories={categories} accounts={accounts} cards={cards} />
      </div>

      <div className="mt-8">
        <PaginationControls currentPage={page} totalPages={totalPages} totalResults={totalCount} />
      </div>
    </main>
  );
}