'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/shared/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Lista de rotas onde o layout padrão (Header + Container) NÃO deve aparecer
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    // Retorna o conteúdo "cru" (full screen) para login/register
    return <>{children}</>;
  }

  // Retorna o layout padrão do dashboard
  return (
    <>
      <Header />
      <main className="container mx-auto p-4 space-y-8">
        {children}
      </main>
    </>
  );
}