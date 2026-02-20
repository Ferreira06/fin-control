import prisma from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getRecurringBalance } from '@/lib/actions'; 
import { RecurringBalanceCard } from '@/components/recurring/RecurringBalanceCard';
import { AddRecurringModal } from '@/components/recurring/AddRecurringModal';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Trash2, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteRecurringTransaction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function RecurringPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [recurringTransactions,categories,{ totalRecurringBalance }] = await Promise.all([prisma.recurringTransaction.findMany({  where: { userId: session.user.id },  include: { category: true },  orderBy: { startDate: 'desc' }}),prisma.category.findMany({ where: { userId: session.user.id } }),getRecurringBalance()]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas e Recorrências</h1>
          <p className="text-muted-foreground">O motor inteligente que projeta o seu futuro financeiro.</p>
        </div>
        <AddRecurringModal categories={categories} />
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <RecurringBalanceCard balance={totalRecurringBalance} />
        </div>
        
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Seus Contratos Ativos</CardTitle>
              <CardDescription>
                Excluir uma assinatura removerá as faturas futuras, mas manterá o histórico já pago.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recurringTransactions.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground border-dashed">
                   Você ainda não cadastrou nenhuma conta fixa ou assinatura.
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Iniciou em</TableHead>
                        <TableHead className="text-right pr-6">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringTransactions.map(rt => (
                        <TableRow key={rt.id}>
                          <TableCell className="pl-6 font-medium">
                            <div className="flex flex-col">
                              <span>{rt.description}</span>
                              <span className="text-xs text-muted-foreground">{rt.category.icon} {rt.category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`font-bold ${rt.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {rt.type === 'INCOME' ? '+' : '-'} {formatCurrency(rt.amount)}
                          </TableCell>
                          <TableCell><Badge variant="outline">{rt.frequency === 'MONTHLY' ? 'Mensal' : rt.frequency === 'YEARLY' ? 'Anual' : 'Seman/Diário'}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{format(new Date(rt.startDate), 'dd/MM/yyyy', {locale: ptBR})}</TableCell>
                          <TableCell className="text-right pr-6">
                            <form action={async () => {
                              'use server';
                              const fData = new FormData();
                              fData.append('id', rt.id);
                              await deleteRecurringTransaction({ success: false, message: ''}, fData);
                            }}>
                               <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}