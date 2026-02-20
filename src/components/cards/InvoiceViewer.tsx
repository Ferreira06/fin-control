'use client';

import { useState, useActionState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, DollarSign, Calendar } from "lucide-react";
import { payInvoice } from "@/lib/actions/invoice-actions";
import { toast } from "sonner";
import { RecentTransactions } from "../dashboard/RecentTransactions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InvoiceViewer({ card, accounts }: { card: any, accounts: any[] }) {
  // Define a fatura inicial como a última ou a fatura aberta mais antiga
  const openInvoice = card.invoices.find((i: any) => i.status === 'OPEN') || card.invoices[card.invoices.length - 1];
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(openInvoice?.id || '');
  const [payState, formAction] = useActionState(payInvoice, { success: false, message: '' });

  useEffect(() => {
    if (payState.message) {
      if (payState.success) toast.success(payState.message);
      else toast.error(payState.message);
    }
  }, [payState]);

  const selectedInvoice = card.invoices.find((i: any) => i.id === selectedInvoiceId);

  if (!card.invoices || card.invoices.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground border-dashed">
        Ainda não há lançamentos para este cartão.
      </Card>
    );
  }

  // Define se a fatura já deveria estar fechada baseado no dia atual vs closingDay
  const today = new Date();
  const isVisuallyClosed = selectedInvoice?.status === 'OPEN' && 
                          (today.getFullYear() > selectedInvoice.year || 
                          (today.getFullYear() === selectedInvoice.year && today.getMonth() + 1 > selectedInvoice.month) ||
                          (today.getMonth() + 1 === selectedInvoice.month && today.getDate() >= card.closingDay));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
            <SelectTrigger className="w-[200px] text-lg font-semibold bg-background">
              <SelectValue placeholder="Selecione a fatura" />
            </SelectTrigger>
            <SelectContent>
              {card.invoices.map((inv: any) => {
                const date = new Date(inv.year, inv.month - 1);
                return (
                  <SelectItem key={inv.id} value={inv.id}>
                    Fatura {format(date, "MMM/yyyy", { locale: ptBR }).toUpperCase()}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedInvoice && (
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total da Fatura</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}
                </p>
             </div>
             
             {selectedInvoice.status === 'PAID' ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 py-1.5 text-sm gap-1">
                  <CheckCircle2 className="h-4 w-4" /> PAGA
                </Badge>
             ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={isVisuallyClosed ? 'default' : 'secondary'} className={isVisuallyClosed ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                      <DollarSign className="mr-2 h-4 w-4" /> Pagar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pagar Fatura - {format(new Date(selectedInvoice.year, selectedInvoice.month - 1), "MMM/yyyy", { locale: ptBR })}</DialogTitle>
                    </DialogHeader>
                    <form action={formAction} className="space-y-4 pt-4">
                      <input type="hidden" name="invoiceId" value={selectedInvoice.id} />
                      <input type="hidden" name="cardId" value={card.id} />
                      <input type="hidden" name="amount" value={selectedInvoice.amount} />
                      
                      <div className="space-y-2">
                        <Label>De qual conta o dinheiro vai sair?</Label>
                        <Select name="accountId" required defaultValue={card.defaultAccountId || undefined}>
                          <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                          <SelectContent>
                            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit">Confirmar Pagamento</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
             )}
           </div>
        )}
      </div>

      {/* Tabela Reutilizada do Dashboard para as Transações da Fatura */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden mt-6">
        <RecentTransactions transactions={selectedInvoice?.transactions || []} categories={[]} />
      </div>
    </div>
  );
}