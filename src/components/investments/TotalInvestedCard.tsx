// file: src/components/dashboard/TotalInvestedCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';

interface TotalInvestedCardProps {
  totalInvested: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function TotalInvestedCard({ totalInvested }: TotalInvestedCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Patrimônio Investido</CardTitle>
        <PiggyBank className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(totalInvested)}
        </div>
        <p className="text-xs text-muted-foreground">
          Soma de todos os seus ativos.
        </p>
      </CardContent>
    </Card>
  );
}