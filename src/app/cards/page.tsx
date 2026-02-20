import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCreditCards, deleteCreditCard } from "@/lib/actions/credit-card-actions";
import { getBankAccounts } from "@/lib/actions/account-actions";
import { AddCreditCardModal } from "@/components/cards/AddCreditCardModal";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CreditCard as CardIcon, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeleteCardButton } from "@/components/cards/DeleteCardButton";

export const dynamic = 'force-dynamic';

export default async function CardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Buscamos os cartões e as contas bancárias ativas
  const [cards, accounts] = await Promise.all([
    getCreditCards(),
    getBankAccounts(false)
  ]);

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus cartões, limites e faturas.</p>
        </div>
        <AddCreditCardModal accounts={accounts} />
      </header>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CardIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Adicione seu primeiro cartão de crédito para começar a acompanhar suas faturas e limites.
          </p>
          <AddCreditCardModal accounts={accounts} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden flex flex-col justify-between">
              {/* Detalhe visual na borda baseado na bandeira */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  card.brand === 'Mastercard' ? 'bg-orange-500' : 
                  card.brand === 'Visa' ? 'bg-blue-600' : 'bg-primary'
              }`} />
              
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2 pl-6">
                  <div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">{card.brand}</p>
                    {card.defaultAccountId && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                         Pagamento: {accounts.find(acc => acc.id === card.defaultAccountId)?.name}
                      </p>
                    )}
                  </div>
                  <DeleteCardButton cardId={card.id} />
                </CardHeader>
                
                <CardContent className="pl-6 space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Limite Disponível</p>
                      <p className="text-xs text-muted-foreground">de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}</p>
                    </div>
                    <p className={`text-2xl font-bold ${card.availableLimit > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.availableLimit)}
                    </p>
                    
                    {/* Barrinha de progresso do limite */}
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                       <div 
                         className={`h-2 rounded-full ${card.availableLimit > 0 ? 'bg-primary' : 'bg-red-500'}`} 
                         style={{ width: `${Math.min(100, (card.usedLimit / card.limit) * 100)}%` }} 
                       />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-md mt-4">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Fecha dia</span>
                      <span className="font-medium text-red-500">{card.closingDay}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-muted-foreground text-xs">Vence dia</span>
                      <span className="font-medium">{card.dueDay}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Novo Footer com a ação principal */}
              <CardFooter className="pl-6 pt-2 pb-4">
                 <Button asChild className="w-full" variant="secondary">
                    <Link href={`/cards/${card.id}`}>
                      Acessar Faturas <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}