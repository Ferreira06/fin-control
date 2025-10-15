// file: src/components/dashboard/RecentTransactions.tsx

'use client';

import { Transaction, Category } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useFormState, useFormStatus } from 'react-dom';
import { deleteTransaction, DeleteState } from '@/lib/actions';
import { Button } from '../ui/button';
import { useActionState, useEffect } from 'react';
import { EditTransactionModal } from '../shared/EditTransactionModal';
import { Trash2, Clock, ExternalLink  } from 'lucide-react'; 
import Link from 'next/link';

type TransactionWithCategory = Transaction & { category: Category; isProjected?: boolean };

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="ghost" size="icon" disabled={pending} aria-label="Deletar Transação">
            <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
    )
}

function TransactionDeleteForm({ transactionId }: { transactionId: string }) {
  const initialState: DeleteState = { success: false, message: '' };
  const [state, formAction] = useActionState(deleteTransaction, initialState);

  useEffect(() => {
    if (!state.success && state.message) {
      // Em uma aplicação real, você usaria um sistema de "toast" para mostrar o erro.
      alert(`Erro: ${state.message}`);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={transactionId} />
      <DeleteButton />
    </form>
  );
}


export function RecentTransactions({ 
  transactions, 
  categories 
}: { 
  transactions: TransactionWithCategory[];
  categories: Category[];
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Últimas Transações</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/transactions">Ver Todas</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id} className={t.isProjected ? 'opacity-80' : ''}>
                <TableCell className="font-medium flex items-center gap-2">
                  {t.isProjected && <Clock className="h-4 w-4" />}
                  {t.description}
                </TableCell>
                <TableCell><Badge variant="outline">{t.category.name}</Badge></TableCell>
                <TableCell>{t.isProjected ? 'Pendente' : format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className={`text-right font-bold ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell className="flex justify-center items-center gap-1">
                    {/* Desabilita os botões para despesas projetadas, pois elas não podem ser editadas/deletadas daqui */}
                    {!t.isProjected ? (
                        <>
                            <EditTransactionModal transaction={t} categories={categories} />
                            <TransactionDeleteForm transactionId={t.id} />
                        </>
                    ) : (
                        <Link href="/recurring" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ExternalLink></ExternalLink></Link>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}