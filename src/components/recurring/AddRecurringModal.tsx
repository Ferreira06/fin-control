'use client';

import { useActionState, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, TrendingDown, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addRecurringTransaction, RecurringFormState } from '@/lib/actions';
import { Frequency } from '@prisma/client';

export function AddRecurringModal({ categories }: { categories: any[] }) {
  const [state, formAction, isPending] = useActionState(addRecurringTransaction, { success: false, message: '' });
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setOpen(false);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const filteredCategories = categories.filter(c => c.type === txType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><RefreshCw className="mr-2 h-4 w-4" /> Nova Assinatura/Parcelamento</Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Recorrência</DialogTitle>
          <DialogDescription>
             Assinaturas mensais ou compras parceladas que geram faturas automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4 pt-2">
          {/* TIPO */}
          <RadioGroup value={txType} onValueChange={(v: any) => setTxType(v)} name="type" className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <div className="relative"><RadioGroupItem value="EXPENSE" id="r-expense" className="peer sr-only" /><Label htmlFor="r-expense" className="flex flex-col items-center justify-center rounded-md p-2 hover:bg-background peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-red-600 peer-data-[state=checked]:shadow-sm cursor-pointer transition-all"><TrendingDown className="mb-1 h-4 w-4" /> Despesa</Label></div>
            <div className="relative"><RadioGroupItem value="INCOME" id="r-income" className="peer sr-only" /><Label htmlFor="r-income" className="flex flex-col items-center justify-center rounded-md p-2 hover:bg-background peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-emerald-600 peer-data-[state=checked]:shadow-sm cursor-pointer transition-all"><TrendingUp className="mb-1 h-4 w-4" /> Receita</Label></div>
          </RadioGroup>

          {/* DESCRIÇÃO E VALOR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Descrição</Label><Input name="description" placeholder="Ex: Netflix, Conta de Luz..." required /></div>
            <div className="col-span-2 space-y-2"><Label>Valor Base (R$)</Label><Input name="amount" type="number" step="0.01" required placeholder="0.00" className="text-xl font-bold" /></div>

            {/* CATEGORIA E FREQUENCIA */}
            <div className="space-y-2"><Label>Categoria</Label>
              <Select name="categoryId" required><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Frequência</Label>
              <Select name="frequency" defaultValue={Frequency.MONTHLY} required><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Mensal</SelectItem><SelectItem value="YEARLY">Anual</SelectItem><SelectItem value="WEEKLY">Semanal</SelectItem><SelectItem value="DAILY">Diário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DATAS */}
            <div className="space-y-2"><Label>Começa em:</Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "dd/MM/yyyy", {locale: ptBR}) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent></Popover>
              <input type="hidden" name="startDate" value={startDate?.toISOString() || ''} />
            </div>
            <div className="space-y-2"><Label>Termina em: (Opcional)</Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "dd/MM/yyyy", {locale: ptBR}) : <span>Sempre (Contínuo)</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent></Popover>
              <input type="hidden" name="endDate" value={endDate?.toISOString() || ''} />
            </div>
          </div>

          <DialogFooter className="pt-4">
             <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
             <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}