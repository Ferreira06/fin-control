// file: src/app/(dashboard)/page.tsx

import { getInvestmentsSummary, getMonthlySummary } from '@/lib/actions';
import { AddTransactionModal } from '@/components/shared/AddTransactionalModal';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import prisma from '@/lib/prisma';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { ImportModal } from '@/components/shared/ImportModal';
import { Suspense } from 'react';
import { AiInsightsCard } from '@/components/dashboard/AiInsightsCard';

export const dynamic = 'force-dynamic';

// A página agora recebe 'searchParams'
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  // Converte os parâmetros da URL para objetos Date
  const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const toDate = searchParams.to ? new Date(searchParams.to) : undefined;

    // Busca os dados de ambas as fontes
  const summaryPromise = getMonthlySummary({ from: fromDate, to: toDate });
  const investmentsPromise = getInvestmentsSummary();

  const [
    { transactions, income, expenses, balance },
    { totalInvested }
  ] = await Promise.all([summaryPromise, investmentsPromise]);

  const categories = await prisma.category.findMany();

  

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças.</p>
        </div>
        <div className="flex items-center gap-4">
          <DateFilter />
          <AddTransactionModal categories={categories} />
           <ImportModal />
        </div>
      </header>

      {/* Cards de Estatísticas */}
      <StatsCards income={income} expenses={expenses} balance={balance} totalInvested={totalInvested} />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1">
          <CategoryPieChart transactions={transactions} />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions.slice(0, 10)}
            categories={categories}
          />
        </div>
      </div>
      <div className="grid gap-8 mt-8">
      <AiInsightsCard />
      </div>
    </main>
  );
}