'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, Loader2, ArrowRight } from "lucide-react";

import { createBankAccount } from "@/lib/actions/account-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateAccountOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createBankAccount(formData);
      
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        // Força a atualização da página para o servidor refazer a checagem de contas
        router.refresh(); 
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="animate-in fade-in zoom-in duration-500 delay-300">
          <Wallet className="mr-2 h-5 w-5" />
          Criar Minha Primeira Conta
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta Financeira</DialogTitle>
          <DialogDescription>
            Adicione sua conta bancária ou carteira para começarmos a organizar suas finanças.
          </DialogDescription>
        </DialogHeader>
        
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Ex: Nubank, Itaú, Carteira..." 
              required 
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Select name="type" required defaultValue="CHECKING">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                <SelectItem value="SAVINGS">Conta Poupança</SelectItem>
                <SelectItem value="INVESTMENT">Conta Investimento</SelectItem>
                <SelectItem value="WALLET">Carteira Física (Dinheiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="initialBalance">Saldo Inicial (R$)</Label>
            <Input 
              id="initialBalance" 
              name="initialBalance" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Você pode colocar 0 e adicionar transações depois.
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Criar Conta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}