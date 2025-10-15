// file: src/components/shared/EditTransactionModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef, useState } from 'react';
import { updateTransaction, FormState } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Category, Transaction } from '@prisma/client';

type EditTransactionModalProps = {
  transaction: Transaction;
  categories: Category[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Alterações'}
    </Button>
  );
}

export function EditTransactionModal({ transaction, categories }: EditTransactionModalProps) {
  const initialState: FormState = { success: false, message: '' };
  const [state, formAction] = useActionState(updateTransaction, initialState);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(transaction.date));

  useEffect(() => {
    if (state.success) {
      setOpen(false); // Fecha o modal em caso de sucesso
    }
  }, [state]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar Transação">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* O ID é enviado de forma oculta */}
          <input type="hidden" name="id" value={transaction.id} />

          {/* Tipo de Transação */}
          <RadioGroup defaultValue={transaction.type} name="type" className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="INCOME" id="r-income-edit" /><Label htmlFor="r-income-edit">Receita</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="EXPENSE" id="r-expense-edit" /><Label htmlFor="r-expense-edit">Despesa</Label></div>
          </RadioGroup>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required defaultValue={transaction.description} />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required defaultValue={Math.abs(transaction.amount)} />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select name="categoryId" required defaultValue={transaction.categoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
            </Popover>
            <input type="hidden" name="date" value={date?.toISOString()} />
          </div>

          <DialogFooter>
             <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}