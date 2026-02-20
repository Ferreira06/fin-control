/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateProfile, updatePassword } from "@/lib/actions/user-settings";
import { Loader2 } from "lucide-react";


export function ProfileSettings({ user }: { user: any }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleProfileUpdate(formData: FormData) {
    setIsLoading(true);
    const res = await updateProfile(formData);
    setIsLoading(false);
    
    if (res.error) toast.error(res.error);
    else toast.success(res.success);
  }

  async function handlePasswordUpdate(formData: FormData) {
    setIsLoading(true);
    const res = await updatePassword(formData);
    setIsLoading(false);

    if (res.error) toast.error(res.error);
    else {
      toast.success(res.success);
      (document.getElementById("password-form") as HTMLFormElement).reset();
    }
  }

  return (
    <div className="grid gap-6">
      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Atualize suas informações públicas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={user.email} required type="email" />
            </div>
            <Button disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha (apenas se tiver senha) */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Gerencie sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" action={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
              </div>
            </div>
            <Button variant="secondary" disabled={isLoading}>
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}