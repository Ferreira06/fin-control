'use client';

import { Transaction, Category, BankAccount, Tag, Attachment } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useFormStatus } from 'react-dom';
import { deleteTransaction, DeleteState } from '@/lib/actions';
import { Button } from '../ui/button';
import { useActionState, useEffect } from 'react';
import { ViewTransactionModal } from '../shared/ViewTransactionModal'; // <-- NOVO IMPORT
import { Trash2, Clock, ExternalLink, ArrowRightLeft } from 'lucide-react'; 
import Link from 'next/link';
import { toast } from 'sonner';

// Atualizamos a tipagem para suportar os novos dados
type TransactionWithCategory = Transaction & { 
  category: Category; 
  account?: BankAccount; 
  tags?: Tag[]; 
  attachments?: Attachment[]; 
  isProjected?: boolean;
};

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="ghost" size="icon" disabled={pending} aria-label="Deletar Transação" className="hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
    )
}

function TransactionDeleteForm({ transactionId }: { transactionId: string }) {
  const initialState: DeleteState = { success: false, message: '' };
  const [state, formAction] = useActionState(deleteTransaction, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) toast.success(state.message);
      else toast.error(state.message);
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
    }).format(Math.abs(value)); // Removido o sinal negativo nativo para podermos customizar na UI
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className={t.isProjected ? 'opacity-70 bg-muted/30' : 'hover:bg-muted/30 transition-colors'}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {t.isProjected && <Clock className="h-4 w-4 text-muted-foreground" title="Transação Futura" />}
                      {t.type === 'TRANSFER' && <ArrowRightLeft className="h-4 w-4 text-blue-500" title="Transferência" />}
                      <span className="truncate max-w-[150px] sm:max-w-[300px]">{t.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal whitespace-nowrap">
                       <span className="mr-1">{t.category?.icon || '📌'}</span>
                       {t.category?.name || 'Sem Categoria'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {t.isProjected ? 'Pendente' : format(new Date(t.date), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell className={`text-right font-semibold whitespace-nowrap ${
                    t.type === 'TRANSFER' ? 'text-blue-500' : t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''} {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-0.5">
                          {!t.isProjected ? (
                              <>
                                  <ViewTransactionModal transaction={t} />
                                  <TransactionDeleteForm transactionId={t.id} />
                              </>
                          ) : (
                              <Button asChild variant="ghost" size="icon" title="Gerenciar Recorrência">
                                <Link href="/recurring" className="text-muted-foreground hover:text-primary">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                          )}
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}