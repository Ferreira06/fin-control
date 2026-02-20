'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { authenticate, loginWithGoogle } from '@/lib/actions/auth-actions'; // Supondo que authenticate aceite FormData ou JSON agora
import { Mail, Lock, Loader2, Eye, EyeOff, Wallet } from "lucide-react";
import Link from 'next/link';
import { toast } from "sonner";
import { useSearchParams } from 'next/navigation';
import { useEffect } from "react";

// Schema de validação (Login não precisa de confirmPassword)
const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  });

  // Tratamento de erros da URL (OAuth)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "OAuthAccountNotLinked") {
      toast.error("Conta existente. Use sua senha para vincular.");
      setErrorMessage(error);
    }
  }, [searchParams]);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    
    // Convertemos para FormData para manter compatibilidade com sua Server Action existente
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    // Nota: A função authenticate precisa tratar o retorno corretamente (não jogar erro, retornar obj)
    // Se a sua authenticate retornar uma string de erro em vez de throw, ajuste aqui.
    try {
      const result = await authenticate(undefined, formData);
      if (typeof result === 'string') {
         toast.error(result);
          setErrorMessage(result);
      }
      // Se der sucesso, o redirect acontece no server
    } catch (error) {
      console.log(error);
      toast.error("Ocorreu um erro ao fazer login.");
      setErrorMessage("Ocorreu um erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">FinControl</CardTitle>
          <CardDescription>
            Entre para acessar seu painel financeiro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Button variant="outline" className="w-full relative" type="button" onClick={() => loginWithGoogle()}>
            <svg className="mr-2 h-4 w-4 absolute left-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Entrar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou via email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  autoFocus // UX: Foco automático ao abrir a página
                  placeholder="seu@email.com" 
                  className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="text-xs text-primary hover:underline" tabIndex={-1}>
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className="pl-9 pr-9" 
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-md text-center">
                {errorMessage}
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2 bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 