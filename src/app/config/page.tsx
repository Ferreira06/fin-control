import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CategoryManager } from '@/components/config/CategoryManager';
import { ProfileSettings } from '@/components/config/ProfileSettings';
import { getBudgets } from "@/lib/actions/budget-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { Settings, User } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ConfigPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const searchParams = await props.searchParams;
  const defaultTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'system';

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Buscamos categorias e orçamentos em paralelo
  const [categories, existingBudgets] = await Promise.all([
     prisma.category.findMany({
       orderBy: { name: 'asc' },
       where: { userId: session.user.id },
       include: { tags: true } 
     }),
     getBudgets(currentMonth, currentYear)
  ]);

  return (
    <main className="container mx-auto p-4 md:py-8 max-w-5xl">
      <div className="flex flex-col gap-2 mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta, categorias e limites do sistema.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[450px] h-auto p-2.5 bg-muted/80 rounded-xl">
          <TabsTrigger value="system" className="py-2.5 gap-2 rounded-lg data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" /> 
            <span className="hidden sm:inline font-medium">Sistema & Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="py-2.5 gap-2 rounded-lg data-[state=active]:shadow-sm">
            <User className="h-4 w-4" /> 
            <span className="hidden sm:inline font-medium">Minha Conta</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4 animate-in fade-in duration-500">
           <div className="grid gap-4">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Categorias Financeiras</h3>
                  <p className="text-sm text-muted-foreground">Customize as categorias, crie subgrupos e defina seus limites de gastos (Orçamentos).</p>
                </div>
                <div className="p-6 pt-0">
                   <CategoryManager 
                     initialCategories={categories} 
                     existingBudgets={existingBudgets}
                     month={currentMonth}
                     year={currentYear}
                   />
                </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="profile" className="animate-in fade-in duration-500">
          <ProfileSettings user={session.user} />
        </TabsContent>
      </Tabs>
    </main>
  );
}