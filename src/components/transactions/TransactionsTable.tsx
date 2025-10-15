// file: src/components/transactions/TransactionsTable.tsx
'use client';

import { Category, Transaction } from "@prisma/client";
import { RecentTransactions } from "../dashboard/RecentTransactions"; // Reutilizamos o componente existente!

// Este componente é um "wrapper" para reutilizar a tabela que já temos.
export function TransactionsTable({
  transactions,
  categories,
}: {
  transactions: (Transaction & { category: Category; isProjected?: boolean })[];
  categories: Category[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Nenhuma transação encontrada com os filtros aplicados.
      </div>
    );
  }

  // Reutilizamos o componente do dashboard, mas sem o título e o card em volta.
  // Se quiser um layout diferente, pode copiar a lógica de 'RecentTransactions' para cá.
  return <RecentTransactions transactions={transactions} categories={categories} />;
}