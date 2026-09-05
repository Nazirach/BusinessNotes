FROM node:20-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm check && pnpm test && pnpm build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 3000
CMD ["pnpm", "start"]
