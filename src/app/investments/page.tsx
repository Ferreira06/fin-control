// file: src/app/investments/page.tsx
import { getInvestmentsSummary } from '@/lib/actions';
import { InvestmentManager } from '@/components/investments/InvestmentManager';

export const dynamic = 'force-dynamic';

export default async function InvestmentsPage() {
  const { portfolio, totalInvested } = await getInvestmentsSummary();

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Carteira de Investimentos</h1>
        <p className="text-muted-foreground">Acompanhe a evolução do seu patrimônio.</p>
      </header>
      
      <InvestmentManager initialPortfolio={portfolio} totalInvested={totalInvested} />
    </main>
  );
}