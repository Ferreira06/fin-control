// file: src/components/transactions/TransactionsTable.tsx
'use client';

import { BankAccount, Category, CreditCard, Transaction } from "@prisma/client";
import { RecentTransactions } from "../dashboard/RecentTransactions"; // Reutilizamos o componente existente!

// Este componente é um "wrapper" para reutilizar a tabela que já temos.
export function TransactionsTable({
  transactions,
  categories,
  accounts,
  cards
}: {
  transactions: (Transaction & { category: Category; isProjected?: boolean })[];
  categories: Category[];
  accounts: BankAccount[];
  cards: CreditCard[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Nenhuma transação encontrada com os filtros aplicados.
      </div>
    );
  }

  return <RecentTransactions transactions={transactions} categories={categories} cards={cards} accounts={accounts} />;
}