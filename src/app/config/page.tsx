import prisma from '@/lib/prisma';
import { CategoryManager } from '@/components/config/CategoryManager';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  // Busca todas as categorias existentes no servidor para a renderização inicial
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc', // Ordena por nome
    },
  });

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua aplicação.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Categorias</CardTitle>
          <CardDescription>
            Adicione, visualize e remova as categorias de transações.
          </CardDescription>
        </CardHeader>
        {/* Renderiza o componente de cliente que cuida da interatividade */}
        <CategoryManager initialCategories={categories} />
      </Card>
    </main>
  );
}