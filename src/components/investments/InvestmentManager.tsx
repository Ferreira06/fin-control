// file: src/components/investments/InvestmentManager.tsx
'use client';

import { Investment, InvestmentTransaction, InvestmentType, InvestmentMovementType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';
// Importe os novos modais
import { AddAssetModal } from './AddAssetModal';
import { InvestmentMovementModal } from './InvestmentMovementModal';

type PortfolioItem = Investment & { balance: number; transactions: InvestmentTransaction[] };

export function InvestmentManager({
  initialPortfolio,
  totalInvested
}: {
  initialPortfolio: PortfolioItem[];
  totalInvested: number;
}) {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8">
      {/* Card de Resumo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className='space-y-1.5'>
                <CardTitle>Patrimônio Investido</CardTitle>
                <CardDescription>Soma de todos os seus ativos.</CardDescription>
            </div>
            <PiggyBank className="h-8 w-8 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalInvested)}</p>
        </CardContent>
      </Card>

      {/* Seção de Gerenciamento */}
       <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <CardTitle>Meus Ativos</CardTitle>
                <div className='flex gap-2'>
                    {/* SUBSTITUA os botões pelos novos modais */}
                    <AddAssetModal />
                    <InvestmentMovementModal investments={initialPortfolio} />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className='space-y-4'>
                {initialPortfolio.map(item => (
                    <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.broker} - {item.type}</p>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(item.balance)}</p>
                    </div>
                ))}
                {initialPortfolio.length === 0 && <p className='text-center text-muted-foreground'>Você ainda não possui ativos. Adicione um para começar.</p>}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}