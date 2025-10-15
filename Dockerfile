# 1. Estágio de Instalação de Dependências
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Estágio de Build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gera o cliente Prisma
RUN npx prisma generate
# Builda a aplicação Next.js
RUN npm run build

# 3. Estágio de Produção
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER node

EXPOSE 7779

CMD ["npm", "start"]