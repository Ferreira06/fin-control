import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InvoiceViewer } from "@/components/cards/InvoiceViewer";
import { getBankAccounts } from "@/lib/actions/account-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CardDetailsPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await props.params;

  const [card, accounts] = await Promise.all([
    prisma.creditCard.findUnique({
      where: { id: resolvedParams.id, userId: session.user.id },
      include: {
        invoices: {
          include: {
            transactions: { include: { category: true, tags: true, attachments: true }, orderBy: { date: 'desc' } }
          },
          orderBy: [ { year: 'asc' }, { month: 'asc' } ]
        }
      }
    }),
    getBankAccounts(false)
  ]);

  if (!card) redirect("/cards");

  return (
    <main className="container mx-auto p-4 md:p-8 space-y-6">
      <header className="mb-4">
        <Button asChild variant="ghost" className="mb-4 -ml-4 text-muted-foreground">
          <Link href="/cards"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Cartões</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{card.name}</h1>
        <p className="text-muted-foreground">Vencimento dia {card.dueDay} • Fechamento dia {card.closingDay}</p>
      </header>
      
      <InvoiceViewer card={card} accounts={accounts} />
    </main>
  );
}