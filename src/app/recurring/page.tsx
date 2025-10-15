// file: src/app/recurring/page.tsx

import prisma from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RecurringManager } from '@/components/recurring/RecurringManager';
import { getRecurringBalance } from '@/lib/actions'; // Importa a função centralizada
import { RecurringBalanceCard } from '@/components/recurring/RecurringBalanceCard'; // Importa o novo componente de card

export const dynamic = 'force-dynamic';

export default async function RecurringPage() {
  // Busca todos os dados necessários em paralelo para otimizar o carregamento
  const recurringTransactionsPromise = prisma.recurringTransaction.findMany({
    include: {
      category: true,
    },
    orderBy: {
      startDate: 'desc',
    },
  });
  const categoriesPromise = prisma.category.findMany();
  const recurringBalancePromise = getRecurringBalance(); // Usa a nova função aqui

  // Aguarda a resolução de todas as buscas de dados
  const [
    recurringTransactions,
    categories,
    { totalRecurringBalance }
  ] = await Promise.all([
    recurringTransactionsPromise,
    categoriesPromise,
    recurringBalancePromise
  ]);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Receitas e Despesas Recorrentes</h1>
        <p className="text-muted-foreground">Gerencie suas movimentações fixas e parcelamentos.</p>
      </header>

      {/* Card de Resumo agora é o componente reutilizável */}
      <div className="mb-8">
        <RecurringBalanceCard balance={totalRecurringBalance} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Recorrências</CardTitle>
          <CardDescription>
            Adicione movimentações que se repetem. Para parcelamentos, defina uma data de término.
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

