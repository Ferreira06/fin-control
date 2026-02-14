import { auth } from "@/lib/auth";
import { getBankAccounts } from "@/lib/actions/account-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Building2, PiggyBank, TrendingUp, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import AddAccountModal from "@/components/accounts/AddAcountModal";

export default async function AccountsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const accounts = await getBankAccounts();

  const getIcon = (type: string) => {
    switch (type) {
      case "WALLET": return <Wallet className="h-5 w-5 text-emerald-500" />;
      case "SAVINGS": return <PiggyBank className="h-5 w-5 text-pink-500" />;
      case "INVESTMENT": return <TrendingUp className="h-5 w-5 text-purple-500" />;
      default: return <Building2 className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas & Carteiras</h1>
          <p className="text-muted-foreground">Gerencie seus saldos e fontes de recursos.</p>
        </div>
        <AddAccountModal />
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl bg-muted/20 text-center">
             <div className="bg-muted p-4 rounded-full mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-semibold">Nenhuma conta encontrada</h3>
             <p className="text-muted-foreground max-w-sm mt-2 mb-6">
               Adicione sua primeira conta bancária ou carteira para começar a registrar transações.
             </p>
             <AddAccountModal />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-all cursor-default border-l-4" style={{ borderLeftColor: account.color || 'var(--primary)' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {account.type === 'WALLET' ? 'Carteira Física' : account.type === 'SAVINGS' ? 'Poupança' : 'Conta Corrente'}
                </CardTitle>
                <div className="p-2 bg-muted/50 rounded-full">
                  {getIcon(account.type)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.initialBalance)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                   <p className="text-sm font-medium">{account.name}</p>
                   <span className="text-xs text-muted-foreground">• {account._count.transactions} lançamentos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}