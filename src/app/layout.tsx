import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import AppLayout from "@/components/shared/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/shared/Header"; // <--- Importe o Header aqui

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinControl",
  description: "Gerenciador financeiro pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Passamos o Header como prop para o componente Cliente */}
          <AppLayout header={<Header />}>
            {children}
          </AppLayout>
          
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}