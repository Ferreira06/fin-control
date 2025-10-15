// src/app/reports/page.tsx
import { getReportsSummary } from '@/lib/actions';
import { MonthlySummaryChart } from '@/components/reports/MonthlySummaryChart';
import { CategorySpendingChart } from '@/components/reports/CategorySpendingChart';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { last12MonthsData, top5Categories } = await getReportsSummary();

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
        <p className="text-muted-foreground">Analise suas tendências financeiras ao longo do tempo.</p>
      </header>
      <MonthlySummaryChart data={last12MonthsData} />
      <CategorySpendingChart data={last12MonthsData} topCategories={top5Categories} />
    </main>
  );
}