# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY package.json pnpm-lock.yaml* tsconfig.json vite.config.ts ./
COPY tsconfig.node.json vitest.config.ts ./

ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM nginx:1.27-alpine AS runner
COPY --from=base /app/dist /usr/share/nginx/html
COPY --from=base /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
