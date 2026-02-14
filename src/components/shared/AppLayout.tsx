'use client';

import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode; 
}

export default function AppLayout({ children, header }: AppLayoutProps) {
  const pathname = usePathname();
  // Lista de rotas onde o Header NÃO deve aparecer
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    // Retorna apenas o conteúdo (sem header)
    return <>{children}</>;
  }

  // Renderiza o header passado via prop e o conteúdo
  return (
    <>
      {header}
      <main className="container mx-auto p-4 space-y-8">
        {children}
      </main>
    </>
  );
}