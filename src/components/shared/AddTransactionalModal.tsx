// file: src/components/shared/AddTransactionModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef, useState } from 'react';
import { addTransaction, FormState } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Category } from '@prisma/client';

// Componente para o botão de submit com estado de pending
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Transação'}
    </Button>
  );
}

export function AddTransactionModal({ categories }: { categories: Category[] }) {
  const initialState: FormState = { success: false, message: '' };
  const [state, formAction] = useActionState(addTransaction, initialState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (state.success) {
      setOpen(false); // Fecha o modal em caso de sucesso
      formRef.current?.reset(); // Limpa o formulário
      setDate(new Date());
    }
  }, [state]);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Transação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Tipo de Transação */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup defaultValue="EXPENSE" name="type" className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INCOME" id="r-income" />
                <Label htmlFor="r-income">Receita</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXPENSE" id="r-expense" />
                <Label htmlFor="r-expense">Despesa</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required />
            {state.errors?.fieldErrors?.description && <p className="text-red-500 text-sm">{state.errors.fieldErrors.description}</p>}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
             {state.errors?.fieldErrors?.amount && <p className="text-red-500 text-sm">{state.errors.fieldErrors.amount}</p>}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select name="categoryId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {state.errors?.fieldErrors?.categoryId && <p className="text-red-500 text-sm">{state.errors.fieldErrors.categoryId}</p>}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input type="hidden" name="date" value={date?.toISOString()} />
             {state.errors?.fieldErrors?.date && <p className="text-red-500 text-sm">{state.errors.fieldErrors.date}</p>}
          </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}