import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Adicionamos o ID do usuário ao token JWT aqui, pois isso não exige banco
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    // Opcional: Você pode mover a lógica de proteção de rotas para cá (authorized)
    // ou manter no middleware.ts como estava. Vamos manter providers vazio aqui.
  },
  providers: [], // Os providers reais ficam no auth.ts
} satisfies NextAuthConfig;