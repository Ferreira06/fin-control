// file: src/components/recurring/RecurringManager.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { addRecurringTransaction, deleteRecurringTransaction } from '@/lib/actions';
import { Category, RecurringTransaction, Frequency, TransactionType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

// Botões de Ação
function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Adicionar Recorrência'}</Button>;
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="ghost" size="icon" disabled={pending}><Trash2 className="h-4 w-4 text-red-500" /></Button>;
}

// Formulário de Deleção
function RecurringDeleteForm({ id }: { id: string }) {
  const [state, formAction] = useFormState(deleteRecurringTransaction, { success: false, message: '' });
  useEffect(() => { if (!state.success && state.message) alert(state.message); }, [state]);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <DeleteButton />
    </form>
  );
}

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function RecurringManager({
  initialRecurringTransactions,
  categories,
}: {
  initialRecurringTransactions: (RecurringTransaction & { category: Category })[];
  categories: Category[];
}) {
  const [state, formAction] = useFormState(addRecurringTransaction, { success: false, message: '' });
  const formRef = useRef<HTMLFormElement>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [state]);

  return (
    <>
      {/* Formulário de Adição */}
      <form ref={formRef} action={formAction}>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Tipo de Recorrência</Label>
            <RadioGroup defaultValue={TransactionType.EXPENSE} name="type" className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TransactionType.EXPENSE} id="r-expense" />
                <Label htmlFor="r-expense">Despesa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TransactionType.INCOME} id="r-income" />
                <Label htmlFor="r-income">Receita</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2"><Label htmlFor='description'>Descrição</Label><Input id='description' name="description" placeholder="Ex: Aluguel, Parcela do Carro" required /></div>
          <div className="space-y-2"><Label htmlFor='amount'>Valor (R$)</Label><Input id='amount' name="amount" type="number" step="0.01" placeholder="150.00" required /></div>
          <div className="space-y-2"><Label htmlFor='categoryId'>Categoria</Label><Select name="categoryId" required><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor='frequency'>Frequência</Label><Select name="frequency" defaultValue={Frequency.MONTHLY} required><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{Object.values(Frequency).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Data de Início</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Selecione...</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent></Popover><input type="hidden" name="startDate" value={startDate?.toISOString()} /></div>
          <div className="space-y-2"><Label>Data de Fim (Opcional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>Parcelamento? Defina o fim</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent></Popover><input type="hidden" name="endDate" value={endDate?.toISOString()} /></div>
        </CardContent>
        <CardFooter className='flex-col items-start gap-2'>
            <SubmitButton />
            {!state.success && state.message && <p className='text-sm text-red-500'>{state.message}</p>}
        </CardFooter>
      </form>

      {/* Tabela de Recorrências */}
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Frequência</TableHead><TableHead>Próxima Fatura</TableHead><TableHead>Fim</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {initialRecurringTransactions.map(rt => (
              <TableRow key={rt.id}>
                <TableCell className='font-medium'>{rt.description} <br /><span className='text-xs text-muted-foreground'>{rt.category.name}</span></TableCell>
                <TableCell className={`font-bold ${rt.type === TransactionType.INCOME ? 'text-green-500' : 'text-red-500'}`}>
                  {rt.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(rt.amount)}
                </TableCell>
                <TableCell>{rt.frequency}</TableCell>
                <TableCell>{format(new Date(rt.startDate), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{rt.endDate ? format(new Date(rt.endDate), 'dd/MM/yyyy') : 'Contínuo'}</TableCell>
                <TableCell className="text-right"><RecurringDeleteForm id={rt.id} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </>
  );
}