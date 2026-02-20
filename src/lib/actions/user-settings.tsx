'use server';

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"), // Opcional: validar se email já existe se for mudar
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
  };

  const validated = profileSchema.safeParse(data);
  if (!validated.success) return { error: "Dados inválidos" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name, email: data.email },
    });
    revalidatePath("/");
    return { success: "Perfil atualizado com sucesso!" };
  } catch (error) {
    return { error: "Erro ao atualizar perfil." };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  
  // Verifica se o usuário tem senha (pode ser login social)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: "Usuários de login social não podem alterar senha aqui." };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: "Senha atual incorreta." };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
    return { success: "Senha alterada com sucesso!" };
  } catch (error) {
    return { error: "Erro ao alterar senha." };
  }
}