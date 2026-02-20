import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getInvestmentsSummary, getMonthlySummary, getRecurringBalance } from '@/lib/actions';
import { AddTransactionModal } from '@/components/shared/AddTransactionalModal';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { ImportModal } from '@/components/shared/ImportModal';
import { AiInsightsCard } from '@/components/dashboard/AiInsightsCard';
import { RecurringBalanceCard } from '@/components/recurring/RecurringBalanceCard';
import { TotalInvestedCard } from '@/components/investments/TotalInvestedCard';
import { CreateAccountOnboarding } from '@/components/dashboard/CreateAccountOnboarding';
import { Landmark } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getBankAccounts } from '@/lib/actions/account-actions';
import { getCreditCards } from '@/lib/actions/credit-card-actions';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(
  // CORREÇÃO NEXT 15: searchParams agora é uma Promise
  props: { searchParams: Promise<{ from?: string; to?: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const accounts = await getBankAccounts(false);

  const accountsCount = accounts.length;

  const hasAccounts = accountsCount > 0;

  const cards = await getCreditCards();

  if (!hasAccounts) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[85vh] p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Landmark className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao FinControl!</h1>
            <p className="text-muted-foreground text-lg">
              Para começarmos a acompanhar sua evolução financeira, você precisa registrar sua primeira conta ou carteira.
            </p>
          </div>
          <div className="pt-4">
            <CreateAccountOnboarding />
          </div>
        </div>
      </main>
    );
  }

  // CORREÇÃO NEXT 15: Aguardando os searchParams antes de usar
  const searchParams = await props.searchParams;
  const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const toDate = searchParams.to ? new Date(searchParams.to) : undefined;

  const summaryPromise = getMonthlySummary({ from: fromDate, to: toDate });
  const investmentsPromise = getInvestmentsSummary();
  const recurringBalancePromise = getRecurringBalance();

  const [
    { transactions, income, expenses, balance },
    { totalInvested },
    { totalRecurringBalance }
  ] = await Promise.all([summaryPromise, investmentsPromise, recurringBalancePromise]);

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id }
  });

  // CORREÇÃO TYPESCRIPT: Garantindo que nenhuma transação passe "null" para o gráfico
  const safeTransactions = transactions.map(t => ({
    ...t,
    category: t.category || { 
      id: 'uncategorized', 
      userId: session.user?.id, 
      name: 'Sem Categoria', 
      icon: null, 
      type: t.type 
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <DateFilter />
          <ImportModal />
          <AddTransactionModal categories={categories} accounts={accounts} cards={cards}/>        
        </div>
      </header>
      
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
        <StatsCards income={income} expenses={expenses} balance={balance} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <RecurringBalanceCard balance={totalRecurringBalance} />
          <TotalInvestedCard totalInvested={totalInvested} />
          {/* Usando os dados seguros */}
          <CategoryPieChart transactions={safeTransactions} />
        </div>

        <div className="lg:col-span-2">
          {/* Usando os dados seguros */}
          <RecentTransactions
            transactions={safeTransactions.slice(0, 10)}
            categories={categories}
          />
        </div>
      </div>
      
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
        <AiInsightsCard />
      </div>
    </main>
  );
}