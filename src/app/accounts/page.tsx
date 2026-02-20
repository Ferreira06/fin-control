import { auth } from "@/lib/auth";
import { getBankAccounts } from "@/lib/actions/account-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Building2, PiggyBank, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import AddAccountModal from "@/components/accounts/AddAcountModal";
import { AccountCardActions } from "@/components/accounts/AccountCardActions"; // <-- IMPORT AQUI

export default async function AccountsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Agora ele traz apenas as contas não arquivadas
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
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas & Carteiras</h1>
          <p className="text-muted-foreground">Gerencie suas contas ativas e corrija saldos.</p>
        </div>
        <AddAccountModal />
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 border-dashed">
             <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-primary" />
             </div>
             <h3 className="text-xl font-semibold mb-2">Nenhuma conta ativa</h3>
             <p className="text-muted-foreground mb-4 max-w-sm">
               Você ainda não possui contas ou todas foram arquivadas.
             </p>
             <AddAccountModal />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative hover:shadow-md transition-all cursor-default border-l-4" style={{ borderLeftColor: account.color || 'var(--primary)' }}>
              
              {/* MENU DE AÇÕES (EDITAR, AJUSTAR, ARQUIVAR) */}
              <div className="absolute top-2 right-2">
                <AccountCardActions account={account} />
              </div>

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {account.type === 'WALLET' ? 'Carteira Física' : account.type === 'SAVINGS' ? 'Poupança' : 'Conta Corrente'}
                </CardTitle>
                <div className="p-2 bg-muted/50 rounded-full" style={{ color: account.color || 'inherit' }}>
                  {getIcon(account.type)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {/* Nota: Substitua initialBalance pelo cálculo de saldo real caso você tenha a função pronta no Front-End */}
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