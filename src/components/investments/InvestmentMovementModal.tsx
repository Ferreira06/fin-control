// file: src/components/investments/InvestmentMovementModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { addInvestmentTransaction } from '@/lib/actions';
import { Investment, InvestmentMovementType } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type InvestmentMovementModalProps = {
  investments: Investment[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Registrando...' : 'Registrar Movimentação'}</Button>;
}

export function InvestmentMovementModal({ investments }: InvestmentMovementModalProps) {
  const [state, formAction] = useFormState(addInvestmentTransaction, { success: false, message: '' });
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><ArrowRight className="mr-2 h-4 w-4" /> Aportar / Resgatar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>Adicione um aporte ou resgate em um dos seus ativos.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <RadioGroup defaultValue={InvestmentMovementType.CONTRIBUTION} name="type" className="flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value={InvestmentMovementType.CONTRIBUTION} id="r-contribution" /><Label htmlFor="r-contribution">Aporte (Saída do caixa)</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value={InvestmentMovementType.REDEMPTION} id="r-redemption" /><Label htmlFor="r-redemption">Resgate (Entrada no caixa)</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="investmentId">Ativo</Label>
            <Select name="investmentId" required>
              <SelectTrigger><SelectValue placeholder="Selecione o ativo" /></SelectTrigger>
              <SelectContent>
                {investments.map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="1000.00" required />
          </div>
          <div className="space-y-2">
            <Label>Data da Movimentação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} /></PopoverContent>
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