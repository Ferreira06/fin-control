// file: src/app/recurring/page.tsx

import prisma from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RecurringManager } from '@/components/recurring/RecurringManager';

export const dynamic = 'force-dynamic';

export default async function RecurringPage() {
  // Busca os dados iniciais no servidor
  const recurringTransactions = await prisma.recurringTransaction.findMany({
    include: {
      category: true, // Inclui os dados da categoria para mostrar o nome
    },
    orderBy: {
      startDate: 'desc',
    },
  });
  const categories = await prisma.category.findMany();

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Despesas Recorrentes</h1>
        <p className="text-muted-foreground">Gerencie suas despesas fixas e parcelamentos.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Recorrências</CardTitle>
          <CardDescription>
            Adicione despesas que se repetem. Para parcelamentos, defina uma data de término.
          </CardDescription>
        </CardHeader>
        <RecurringManager
          initialRecurringTransactions={recurringTransactions}
          categories={categories}
        />
      </Card>
    </main>
  );
}