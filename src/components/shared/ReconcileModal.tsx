'use client';

import { useActionState, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { reconcileTransaction } from '@/lib/actions';

export function ReconcileModal({ transaction, accounts = [], cards = [] }: { transaction: any, accounts?: any[], cards?: any[] }) {
  const [state, formAction, isPending] = useActionState(reconcileTransaction, { success: false, message: '' });
  const [open, setOpen] = useState(false);

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

  const defaultDate = new Date(transaction.date).toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-8 gap-1 font-semibold w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          <CheckCircle2 className="h-4 w-4" /> Conciliar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conciliar Lançamento</DialogTitle>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4 pt-2">
          <input type="hidden" name="transactionId" value={transaction.id} />
          <input type="hidden" name="type" value={transaction.type} />

          <div className="bg-muted/30 p-3 rounded-md border text-sm mb-4">
            <p className="text-muted-foreground">Descrição</p>
            <p className="font-semibold text-base">{transaction.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Real (R$)</Label>
              <Input name="amount" type="number" step="0.01" required defaultValue={Math.abs(transaction.amount)} />
            </div>
            <div className="space-y-2">
              <Label>Data Efetiva</Label>
              <Input name="date" type="date" required defaultValue={defaultDate} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>{transaction.type === 'INCOME' ? 'Recebido em:' : 'Pago com:'}</Label>
              <Select name="accountId" required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <optgroup label="Contas Bancárias" className="p-1 font-semibold text-muted-foreground text-xs uppercase">
                    {accounts.map((a: any) => <SelectItem key={a.id} value={`account_${a.id}`}>{a.name}</SelectItem>)}
                  </optgroup>
                  
                  {transaction.type === 'EXPENSE' && cards && cards.length > 0 && (
                    <optgroup label="Cartões de Crédito" className="p-1 font-semibold text-muted-foreground text-xs uppercase mt-2">
                      {cards.map((c: any) => <SelectItem key={c.id} value={`card_${c.id}`}>{c.name}</SelectItem>)}
                    </optgroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
             <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
             <Button type="submit" disabled={isPending}>
               {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}