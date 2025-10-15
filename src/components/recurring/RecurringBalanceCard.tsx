'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface RecurringBalanceCardProps {
  balance: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function RecurringBalanceCard({ balance }: RecurringBalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Balanço Mensal Recorrente</CardTitle>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(balance)}
        </div>
        <p className="text-xs text-muted-foreground">
          Soma de todas as suas receitas e despesas recorrentes.
        </p>
      </CardContent>
    </Card>
  );
}