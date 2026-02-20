import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CategoryManager } from '@/components/config/CategoryManager';
import { ProfileSettings } from '@/components/config/ProfileSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Tab selecionada via URL (ex: /config?tab=profile)
  const defaultTab =  typeof await searchParams.tab === 'string' ? await searchParams.tab : 'system';

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    where: { userId: session.user.id }, // Importante: Filtrar por usuário!
    include: { tags: true } // <-- ADICIONE ESTA LINHA
  });

  return (
    <main className="container mx-auto p-4 md:py-8 max-w-5xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta e configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">Sistema & Categorias</TabsTrigger>
          <TabsTrigger value="profile">Minha Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
           <div className="grid gap-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Categorias Financeiras</h3>
                  <p className="text-sm text-muted-foreground">Customize as categorias para suas transações.</p>
                </div>
                <div className="p-6 pt-0">
                   <CategoryManager initialCategories={categories} />
                </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings user={session.user} />
        </TabsContent>
      </Tabs>
    </main>
  );
}