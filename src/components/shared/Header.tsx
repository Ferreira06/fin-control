import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth"; 
import { UserNav } from "./UserNav";
import { LayoutDashboard, ArrowRightLeft, PieChart, TrendingUp, Wallet } from "lucide-react";

export default async function Header() {
  const session = await auth();

  // Links de navegação centralizados para fácil manutenção
  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
    { href: "/accounts", label: "Contas", icon: Wallet }, // Novo Link
    { href: "/investments", label: "Investimentos", icon: TrendingUp },
    { href: "/reports", label: "Relatórios", icon: PieChart },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo Area */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-primary" />
             </div>
             <span className="font-bold text-lg tracking-tight hidden md:inline-block">
               Fin<span className="text-primary">Control</span>
             </span>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button 
                key={link.href} 
                variant="ghost" 
                asChild 
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 px-4 text-sm font-medium"
              >
                <Link href={link.href}>
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <div className="h-6 w-px bg-border hidden md:block" /> {/* Separador */}

          {session?.user ? (
            <UserNav user={session.user} />
          ) : (
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" asChild>
                 <Link href="/login">Entrar</Link>
               </Button>
               <Button size="sm" asChild>
                 <Link href="/register">Cadastrar</Link>
               </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}