import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from 'next/link';
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinControl",
  description: "Seu controle financeiro pessoal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
           <div>
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            FinControl
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/recurring" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Recorrências
            </Link>
            <Link href="/investments" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Investimentos
            </Link>
            <Link href="/config" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Configurações
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      {children}
    </div>
    </ThemeProvider>
      </body>
    </html>
  );
}