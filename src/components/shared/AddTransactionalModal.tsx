'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addTransaction, FormState } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip, ArrowRightLeft, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Category, CreditCard } from '@prisma/client';
import { toast } from 'sonner';

// Definimos uma interface simplificada para as contas para o componente Client-side
interface SimpleAccount {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Transação
    </Button>
  );
}

export function AddTransactionModal({ 
  categories, 
  accounts, 
  cards = []
}: { 
  categories: Category[]; 
  accounts: SimpleAccount[]; 
  cards?: CreditCard[];
}) {  const [state, formAction] = useActionState(addTransaction, { success: false, message: '' });
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("EXPENSE");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCreditCard, setIsCreditCard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setOpen(false);
        formRef.current?.reset();
        setDate(new Date());
        setTxType("EXPENSE");
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  // Filtra as categorias dinamicamente baseado no tipo da transação
  const filteredCategories = categories.filter(c => c.type === txType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Transação</Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
        </DialogHeader>
        
        <form ref={formRef} action={formAction} className="space-y-4 pt-2">
          {/* SELETOR DE TIPO */}
          <RadioGroup 
            value={txType} 
            onValueChange={(v: any) => setTxType(v)} 
            name="type" 
            className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg"
          >
            <div className="relative">
              <RadioGroupItem value="EXPENSE" id="expense" className="peer sr-only" />
              <Label htmlFor="expense" className="flex flex-col items-center justify-center rounded-md p-2 hover:bg-background peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-red-600 peer-data-[state=checked]:shadow-sm cursor-pointer transition-all">
                <TrendingDown className="mb-1 h-4 w-4" /> Despesa
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="INCOME" id="income" className="peer sr-only" />
              <Label htmlFor="income" className="flex flex-col items-center justify-center rounded-md p-2 hover:bg-background peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-emerald-600 peer-data-[state=checked]:shadow-sm cursor-pointer transition-all">
                <TrendingUp className="mb-1 h-4 w-4" /> Receita
              </Label>
            </div>
            <div className="relative">
              <RadioGroupItem value="TRANSFER" id="transfer" className="peer sr-only" />
              <Label htmlFor="transfer" className="flex flex-col items-center justify-center rounded-md p-2 hover:bg-background peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-blue-600 peer-data-[state=checked]:shadow-sm cursor-pointer transition-all">
                <ArrowRightLeft className="mb-1 h-4 w-4" /> Transferência
              </Label>
            </div>
          </RadioGroup>

          <div className="grid grid-cols-2 gap-4">
            {/* DESCRIÇÃO E VALOR */}
            <div className="col-span-2 space-y-2">
              <Label>Descrição</Label>
              <Input name="description" placeholder={txType === 'TRANSFER' ? 'Ex: Resgate da Poupança' : 'Ex: Aluguel, Salário...'} required />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label>Valor (R$)</Label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="text-xl font-bold" />
            </div>

            {/* CAMPOS DINÂMICOS - TRANSFERÊNCIA */}
            {txType === 'TRANSFER' ? (
              <>
                <div className="col-span-1 space-y-2">
                  <Label>Conta Origem (Sai)</Label>
                  <Select name="fromAccountId" required>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Conta Destino (Entra)</Label>
                  <Select name="toAccountId" required>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              /* CAMPOS DINÂMICOS - RECEITA/DESPESA */
              <>
                <div className="col-span-1 space-y-2">
                  <Label>{txType === 'INCOME' ? 'Receber em:' : 'Pagar com:'}</Label>
                  <Select name="accountId" required onValueChange={(val) => setIsCreditCard(val.startsWith('card_'))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {/* Agrupa Contas Bancárias */}
                      <optgroup label="Contas Bancárias" className="p-1 font-semibold text-muted-foreground text-xs uppercase">
                        {accounts.map(a => <SelectItem key={a.id} value={`account_${a.id}`}>{a.name}</SelectItem>)}
                      </optgroup>
                      
                      {/* Agrupa Cartões de Crédito (SÓ APARECE SE FOR DESPESA) */}
                      {txType === 'EXPENSE' && cards && cards.length > 0 && (
                        <optgroup label="Cartões de Crédito" className="p-1 font-semibold text-muted-foreground text-xs uppercase mt-2">
                          {cards.map(c => <SelectItem key={c.id} value={`card_${c.id}`}>{c.name}</SelectItem>)}
                        </optgroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Categoria Principal</Label>
                  <Select name="categoryId" required onValueChange={(val) => {
                     // Aqui nós resetamos ou forçamos a atualização da tag quando a categoria muda
                     const form = formRef.current;
                     if(form) {
                        const tagInput = form.querySelector('[name="tagId"]') as HTMLInputElement;
                        if(tagInput) tagInput.value = "none";
                     }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhuma categoria criada</SelectItem>
                      ) : (
                        filteredCategories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span>{c.icon}</span> <span>{c.name}</span>
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* CAMPO DE PARCELAMENTO DINÂMICO */}
                {isCreditCard && txType === 'EXPENSE' && (
                  <div className="col-span-1 space-y-2">
                    <Label>Parcelamento</Label>
                    <Select name="installments" defaultValue="1">
                      <SelectTrigger><SelectValue placeholder="1x" /></SelectTrigger>
                      <SelectContent>
                        {[...Array(24)].map((_, i) => (
                           <SelectItem key={i+1} value={(i+1).toString()}>
                             {i+1}x {i > 0 && `(Parcelado)`}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* NOVO CAMPO: TAGS DINÂMICAS */}
                <div className="col-span-2 space-y-2">
                  <Label>Tag / Subgrupo (Opcional)</Label>
                  {/* Pegamos a categoria selecionada e listamos suas tags. Como é server action nativa, o ideal é ter o estado de 'selectedCategory' ou renderizar todas as tags agrupadas */}
                  <Select name="tagId" defaultValue="none">
                    <SelectTrigger><SelectValue placeholder="Selecione uma tag para detalhar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem tag específica</SelectItem>
                      {/* O shadcn/ui SelectGroup permite agrupar opções. Vamos agrupar as tags por categoria para que, dependendo da categoria, a tag esteja disponível */}
                      {filteredCategories.map(c => {
                         if (!c.tags || c.tags.length === 0) return null;
                         return (
                            <optgroup key={c.id} label={c.name} className="p-1 font-semibold text-muted-foreground text-xs uppercase">
                               {c.name}
                               {c.tags.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id} className="pl-4 font-normal text-sm capitalize">
                                     # {t.name}
                                  </SelectItem>
                               ))}
                            </optgroup>
                         )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* DATA */}
            <div className="col-span-2 space-y-2">
              <Label>Data da Transação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
              <input type="hidden" name="date" value={date?.toISOString()} />
            </div>

            {/* ANEXO (COMPROVANTE) */}
            <div className="col-span-2 space-y-2 border-t pt-4 mt-2">
              <Label htmlFor="attachment" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip className="h-4 w-4" /> 
                Anexar Comprovante (Opcional)
              </Label>
              <Input id="attachment" type="file" name="attachment" accept="image/*,.pdf" className="cursor-pointer text-sm" />
            </div>
          </div>

          <DialogFooter className="pt-4">
             <DialogClose asChild>
               <Button type="button" variant="ghost">Cancelar</Button>
             </DialogClose>
             <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}