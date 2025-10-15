import { getMonthlySummary } from '@/lib/actions';
import { AddTransactionModal } from '@/components/shared/AddTransactionalModal';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Busca os dados iniciais no servidor
  const { transactions, income, expenses, balance } = await getMonthlySummary();
  const categories = await prisma.category.findMany();

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <AddTransactionModal categories={categories} />
      </header>

      {/* Cards de Estatísticas */}
      <StatsCards income={income} expenses={expenses} balance={balance} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Gráfico de Pizza por Categoria */}
        <div className="lg:col-span-1">
          <CategoryPieChart transactions={transactions} />
        </div>

        {/* Tabela de Transações Recentes */}
        <div className="lg:col-span-2">
          <RecentTransactions 
            transactions={transactions.slice(0, 10)} 
            categories={categories} 
          />        </div>
      </div>
    </main>
  );
}