
import { getInvestmentsSummary, getMonthlySummary, getRecurringBalance } from '@/lib/actions';
import { AddTransactionModal } from '@/components/shared/AddTransactionalModal';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import prisma from '@/lib/prisma';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { ImportModal } from '@/components/shared/ImportModal';
import { AiInsightsCard } from '@/components/dashboard/AiInsightsCard';
import { RecurringBalanceCard } from '@/components/recurring/RecurringBalanceCard';
import { TotalInvestedCard } from '@/components/investments/TotalInvestedCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const toDate = searchParams.to ? new Date(searchParams.to) : undefined;

  // Busca de dados em paralelo
  const summaryPromise = getMonthlySummary({ from: fromDate, to: toDate });
  const investmentsPromise = getInvestmentsSummary();
  const recurringBalancePromise = getRecurringBalance();

  const [
    { transactions, income, expenses, balance },
    { totalInvested },
    { totalRecurringBalance }
  ] = await Promise.all([summaryPromise, investmentsPromise, recurringBalancePromise]);

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
      
      <StatsCards income={income} expenses={expenses} balance={balance} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-stretch">
        
        <div className="lg:col-span-1 flex flex-col gap-4">
          <RecurringBalanceCard balance={totalRecurringBalance} />
          <TotalInvestedCard totalInvested={totalInvested} />
          <CategoryPieChart transactions={transactions} />
        </div>

        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions.slice(0, 10)}
            categories={categories}
          />
        </div>
      </div>
      
      <div className="mt-8">
        <AiInsightsCard />
      </div>
    </main>
  );
}