'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { User, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { register as registerAction } from '@/lib/actions/auth-actions';

const registerSchema = z.object({
  name: z.string().min(2, "Nome curto demais"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Componente visual de Força da Senha
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 6) strength += 25;
  if (password.length >= 10) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9!@#$%^&*]/.test(password)) strength += 25;

  let color = "bg-red-500";
  let text = "Fraca";
  if (strength >= 50) { color = "bg-yellow-500"; text = "Média"; }
  if (strength >= 75) { color = "bg-blue-500"; text = "Boa"; }
  if (strength === 100) { color = "bg-green-500"; text = "Forte"; }

  return (
    <div className="space-y-1 mt-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Força da senha:</span>
        <span className={color.replace("bg-", "text-")}>{text}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${strength}%` }} 
        />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    watch, // Para monitorar a senha em tempo real
    formState: { errors, isValid } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);

    const result = await registerAction(formData);
    
    if (result?.success) {
      toast.success("Conta criada! Faça login.");
      router.push('/login');
    } else {
      toast.error(result?.message || "Erro ao criar conta");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Nova Conta</CardTitle>
          <CardDescription>Junte-se ao FinControl hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  autoFocus
                  placeholder="Seu Nome" 
                  className={`pl-9 ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("name")} 
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" type="email" placeholder="nome@exemplo.com" 
                  className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("email")} 
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            
            {/* Senha com Força */}
            <div className="space-y-2">
              <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className={`pl-9 pr-9 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="Mínimo 6 caracteres" 
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Barra de Força da Senha */}
              <PasswordStrength password={passwordValue} />

              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirmar */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  className={`pl-9 pr-9 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="Repita a senha" 
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {!errors.confirmPassword && isValid && watch('confirmPassword') && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                </p>
              )}
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Cadastrar <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2 bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}