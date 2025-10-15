// file: src/app/transactions/page.tsx
import { getAllTransactions } from "@/lib/actions";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PaginationControls } from "@/components/transactions/PaginationControl";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parsear e validar os parâmetros da URL
  const page = parseInt(searchParams.page as string) || 1;
  const limit = parseInt(searchParams.limit as string) || 10;
  const query = searchParams.query as string;
  const type = searchParams.type as 'INCOME' | 'EXPENSE' | undefined;
  const from = searchParams.from ? new Date(searchParams.from as string) : undefined;
  const to = searchParams.to ? new Date(searchParams.to as string) : undefined;

  // Buscar os dados com os filtros
  const { transactions, totalCount } = await getAllTransactions({ page, limit, query, type, from, to });
  const categories = await prisma.category.findMany();
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Todas as Transações</h1>
        <p className="text-muted-foreground">Visualize, filtre e gerencie seu histórico completo.</p>
      </header>

      {/* Barra de Filtros */}
      <TransactionFilters />

      {/* Tabela de Transações */}
      <div className="mt-8">
        <TransactionsTable transactions={transactions} categories={categories} />
      </div>

      {/* Controles de Paginação */}
      <div className="mt-8">
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalResults={totalCount}
        />
      </div>
    </main>
  );
}