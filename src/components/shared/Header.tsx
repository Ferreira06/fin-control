// file: src/components/shared/Header.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Landmark, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transações" },
  { href: "/recurring", label: "Recorrências" },
  { href: "/investments", label: "Investimentos" },
  { href: "/reports", label: "Relatórios" },
];

const configItem = { href: "/config", label: "Configurações" };

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Container principal com padding e sem max-width do 'container' */}
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* --- GRUPO ESQUERDO: Logo --- */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Landmark className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">FinControl</span>
          </Link>
        </div>

        {/* --- GRUPO CENTRAL: Navegação (usa flex-1 para empurrar os outros grupos para as pontas) --- */}
        <nav className="relative hidden items-center justify-center flex-1 gap-1 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative transition-colors px-3 py-1.5",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {item.label}
              {pathname === item.href && (
                <motion.span
                  layoutId="underline"
                  className="absolute inset-0 z-[-1] rounded-md bg-accent"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* --- GRUPO DIREITO: Ações e Menu Mobile --- */}
        <div className="flex items-center justify-end gap-2">
          {/* Ações Desktop */}
          <div className="hidden md:flex items-center">
            <Button asChild variant="ghost" size="sm">
              <Link href={configItem.href}>
                <Settings className="h-4 w-4 mr-2" />
                {configItem.label}
              </Link>
            </Button>
            <ThemeToggle />
          </div>

          {/* Menu Mobile (Hamburger) */}
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                <Landmark className="h-6 w-6" />
                <span className="font-bold">FinControl</span>
              </Link>
              <nav className="flex flex-col gap-3">
                {[...navItems, configItem].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "transition-colors hover:text-foreground/90 text-lg",
                      pathname === item.href
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
               <div className="absolute bottom-4 right-4">
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
