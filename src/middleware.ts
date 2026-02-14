// src/middleware.ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config" // Importa a config parcial

// Cria uma instância leve do Auth apenas para o middleware
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/'
  const isOnLogin = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')

  if (isOnDashboard) {
    if (isLoggedIn) return
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isOnLogin) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/', req.nextUrl))
    }
    return
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}