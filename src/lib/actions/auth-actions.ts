'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// --- LOGIN COM GOOGLE ---
export async function loginWithGoogle() {
  await signIn('google', { redirectTo: "/" });
}

// --- LOGIN CREDENTIALS ---
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciais inválidas. Verifique seu email e senha.';
        case 'CallbackRouteError':
          return 'Erro ao tentar fazer login. Tente novamente.';
        default:
          return 'Algo deu errado.';
      }
    }
    throw error;
  }
}

// --- REGISTER ACTION (ATUALIZADA) ---

// Schema atualizado com validação de confirmação
const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"], // O erro aparecerá neste campo
});

export async function register(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    // CORREÇÃO: Use .issues[0].message em vez de .errors[0].message
    return { 
      success: false, 
      message: validatedFields.error.issues[0].message 
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return { success: false, message: "Este email já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true, message: "Conta criada com sucesso!" };

  } catch (error) {
    console.error("Erro no cadastro:", error);
    return { success: false, message: "Erro ao criar conta no banco de dados." };
  }
}