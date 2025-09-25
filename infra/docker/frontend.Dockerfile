# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY package.json pnpm-lock.yaml* tsconfig.json vite.config.ts ./
COPY tsconfig.node.json vitest.config.ts ./

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm build

FROM nginx:1.27-alpine AS runner
COPY --from=base /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
