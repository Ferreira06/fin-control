'use client';

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreVertical, Edit2, Archive, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { archiveBankAccount, updateBankAccount, adjustAccountBalance } from "@/lib/actions/account-actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AccountCardActions({ account }: { account: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<"edit" | "adjust" | null>(null);

  // Ação de arquivar
  const handleArchive = () => {
    if (!confirm("Deseja arquivar esta conta? Ela sumirá do dashboard principal, mas suas transações serão mantidas.")) return;
    startTransition(async () => {
      const res = await archiveBankAccount(account.id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  // Ação de editar nome e cor
  const handleEdit = async (formData: FormData) => {
    startTransition(async () => {
      const res = await updateBankAccount(formData);
      if (res.success) {
        toast.success(res.message);
        setActiveModal(null);
      } else toast.error(res.message);
    });
  };

  // Ação de ajustar saldo
  const handleAdjustBalance = async (formData: FormData) => {
    const newBalance = parseFloat(formData.get("newBalance") as string);
    if (isNaN(newBalance)) {
      toast.error("Valor inválido");
      return;
    }
    startTransition(async () => {
      const res = await adjustAccountBalance(account.id, newBalance);
      if (res.success) {
        toast.success(res.message);
        setActiveModal(null);
      } else toast.error(res.message);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveModal("edit")} className="cursor-pointer">
            <Edit2 className="mr-2 h-4 w-4" /> Editar Conta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal("adjust")} className="cursor-pointer">
            <DollarSign className="mr-2 h-4 w-4" /> Ajustar Saldo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive} className="cursor-pointer text-destructive focus:text-destructive">
            <Archive className="mr-2 h-4 w-4" /> Arquivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Edição */}
      <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          <form action={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={account.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input id="name" name="name" defaultValue={account.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor da Conta (Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input type="color" id="color" name="color" defaultValue={account.color || "#3b82f6"} className="w-16 h-10 p-1" />
                <Input type="text" defaultValue={account.color || "#3b82f6"} disabled className="flex-1" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Ajuste de Saldo */}
      <Dialog open={activeModal === "adjust"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo Real</DialogTitle>
            <DialogDescription>
              Seu saldo dessincronizou com o banco? Insira o saldo exato que está no seu app do banco hoje.
            </DialogDescription>
          </DialogHeader>
          <form action={handleAdjustBalance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBalance">Saldo Atual Correto (R$)</Label>
              <Input id="newBalance" name="newBalance" type="number" step="0.01" required placeholder="0.00" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Corrigir Saldo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}