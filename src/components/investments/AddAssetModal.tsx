// file: src/components/investments/AddAssetModal.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { addInvestmentAsset } from '@/lib/actions';
import { InvestmentType } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Adicionar Ativo'}
    </Button>
  );
}

export function AddAssetModal() {
  const [state, formAction] = useFormState(addInvestmentAsset, { success: false, message: '' });
  const [open, setOpen] = useState(false);
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
        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Novo Ativo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Ativo</DialogTitle>
          <DialogDescription>Cadastre um novo investimento na sua carteira.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ativo</Label>
            <Input id="name" name="name" placeholder="Ex: CDB Liquidez Diária" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker">Corretora / Banco</Label>
            <Input id="broker" name="broker" placeholder="Ex: Nubank, XP Investimentos" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Investimento</Label>
            <Select name="type" required>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {Object.values(InvestmentType).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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