'use client';

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCreditCard } from "@/lib/actions/credit-card-actions";
import { BankAccount } from "@prisma/client";

export function AddCreditCardModal({ accounts }: { accounts: BankAccount[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCreditCard(formData);
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><CreditCard className="mr-2 h-4 w-4" /> Novo Cartão</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
          <DialogDescription>Cadastre seu cartão para gerenciar faturas e parcelamentos.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input id="name" name="name" placeholder="Ex: Nubank, Itaú Black..." required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Limite Total (R$)</Label>
              <Input id="limit" name="limit" type="number" step="0.01" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Bandeira</Label>
              <Select name="brand" defaultValue="Mastercard">
                <SelectTrigger><SelectValue placeholder="Bandeira" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Elo">Elo</SelectItem>
                  <SelectItem value="Amex">Amex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Dia de Fechamento</Label>
              <Input id="closingDay" name="closingDay" type="number" min="1" max="31" placeholder="Ex: 15" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Dia de Vencimento</Label>
              <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Ex: 25" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultAccountId">Conta Bancária de Pagamento Padrão</Label>
            <Select name="defaultAccountId" defaultValue="none">
              <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não vincular agora</SelectItem>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Cartão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}