'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createBankAccount } from "@/lib/actions/account-actions";

export default function AddAccountModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Impede o refresh da página
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await createBankAccount(formData);
    
    setIsLoading(false);

    if (res.success) {
      toast.success(res.message);
      setOpen(false); // Fecha o modal
    } else {
      toast.error(res.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Conta</DialogTitle>
          <DialogDescription>
            Cadastre onde seu dinheiro está guardado (Banco, Carteira, etc).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" name="name" placeholder="Ex: Nubank Principal" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" required defaultValue="CHECKING">
                  <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                      <SelectItem value="SAVINGS">Poupança</SelectItem>
                      <SelectItem value="WALLET">Carteira (Físico)</SelectItem>
                      <SelectItem value="INVESTMENT">Corretora</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="initialBalance">Saldo Atual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                  <Input 
                    id="initialBalance" 
                    name="initialBalance" 
                    type="number" 
                    step="0.01" 
                    className="pl-9"
                    placeholder="0,00" 
                    required 
                  />
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}