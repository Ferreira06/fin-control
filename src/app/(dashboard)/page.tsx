import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getInvestmentsSummary, getMonthlySummary, getRecurringBalance } from '@/lib/actions';
import { AddTransactionModal } from '@/components/shared/AddTransactionalModal';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { ImportModal } from '@/components/shared/ImportModal';
import { RecurringBalanceCard } from '@/components/recurring/RecurringBalanceCard';
import { TotalInvestedCard } from '@/components/investments/TotalInvestedCard';
import { CreateAccountOnboarding } from '@/components/dashboard/CreateAccountOnboarding';
import { redirect } from 'next/navigation';
import { getBankAccounts } from '@/lib/actions/account-actions';
import { getCreditCards } from '@/lib/actions/credit-card-actions';
import { getBudgets } from '@/lib/actions/budget-actions';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(
  props: { searchParams: Promise<{ from?: string; to?: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const searchParams = await props.searchParams;
  const { from, to } = searchParams;
  const currentDate = new Date();

  const [
    accounts,
    cards,
    categories,
    { transactions, income, expenses, balance, spentByCategory },
    { totalRecurringBalance },
    { totalInvested },
    budgets
  ] = await Promise.all([
    getBankAccounts(false),
    getCreditCards(),
    prisma.category.findMany({ where: { userId: session.user.id } }),
    getMonthlySummary({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }),
    getRecurringBalance(),
    getInvestmentsSummary(),
    getBudgets(currentDate.getMonth() + 1, currentDate.getFullYear())
  ]);

  if (accounts.length === 0) {
    return <CreateAccountOnboarding />;
  }

  // Prepara o primeiro nome do usuário para a saudação
  const firstName = session.user.name ? session.user.name.split(' ')[0] : 'Usuário';

  const safeTransactions = transactions.map((t: any) => ({
    ...t,
    category: t.category || {
      id: 'uncategorized', userId: session.user?.id, name: t.type === 'TRANSFER' ? 'Transferência' : 'Sem Categoria', icon: t.type === 'TRANSFER' ? '🔄' : '❓', type: t.type
    }
  }));

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      {/* HEADER OTIMIZADO */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName}! 👋</h1>
          <p className="text-muted-foreground">Aqui está o resumo financeiro do seu mês.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter />
          <ImportModal />
          <AddTransactionModal categories={categories} accounts={accounts} cards={cards}/>        
        </div>
      </header>
      
      {/* ROW 1: CARDS DE KPI */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
        <StatsCards income={income} expenses={expenses} balance={balance} />
      </div>
      
      {/* ROW 2: ÁREA PRINCIPAL (8 colunas) + WIDGETS (4 colunas) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
        
        {/* Main Content (Esquerda/Centro) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <RecentTransactions
            transactions={safeTransactions.slice(0, 15)} // Mostra até 15 aqui pois tem mais espaço
            categories={categories}
            accounts={accounts}
            cards={cards}
          />
        </div>

        {/* Sidebar Widgets (Direita) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <BudgetOverview budgets={budgets} spentByCategory={spentByCategory} />
          <CategoryPieChart transactions={safeTransactions} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
             <RecurringBalanceCard balance={totalRecurringBalance} />
             {totalInvested > 0 && <TotalInvestedCard totalInvested={totalInvested} />}
          </div>
        </div>

      </div>
    </main>
  );
}