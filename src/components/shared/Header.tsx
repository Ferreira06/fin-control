'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Landmark } from "lucide-react"; // Removi Settings pois agora está no UserNav

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./UserNav"; // Importe o novo componente
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/accounts", label: "Contas" },
  { href: "/cards", label: "Cartões" }, // <-- NOVO AQUI
  { href: "/transactions", label: "Transações" },
  { href: "/recurring", label: "Recorrências" },
  { href: "/investments", label: "Investimentos" },
  { href: "/reports", label: "Relatórios" },
];
interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 w-full max-w-[1600px] mx-auto">
        {/* --- Logo --- */}
        <div className="flex items-center mr-4">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-90">
            <div className="bg-primary/10 p-1.5 rounded-lg">
                <Landmark className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block tracking-tight">FinControl</span>
          </Link>
        </div>

        {/* --- Navegação Desktop --- */}
        <nav className="relative hidden items-center space-x-1 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative transition-colors px-3 py-2 rounded-md hover:bg-muted/50",
                pathname === item.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
              {pathname === item.href && (
                <motion.span
                  layoutId="underline"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* --- Ações e Menu Mobile --- */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user && <UserNav user={user} />}
          </div>

          {/* Mobile Toggle */}
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs flex flex-col">
              <div className="flex items-center space-x-2 mb-8">
                <Landmark className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">FinControl</span>
              </div>
              
              <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-4 border-t" />
                <Link
                   href="/config?tab=profile"
                   onClick={() => setSheetOpen(false)}
                   className="flex items-center py-2 px-3 rounded-md text-sm font-medium hover:bg-muted text-muted-foreground"
                >
                  Minha Conta
                </Link>
              </nav>

              <div className="mt-auto flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}