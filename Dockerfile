# Dockerfile
FROM node:20 AS base

# Install dependencies
FROM base AS deps
# RUN apk add --no-cache openssl
# RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --frozen-lockfile


# Build the nitro app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Create an optimised runner image
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nitro
# USER nitro
EXPOSE 8080
ENV PORT 8080
CMD ["node", ".output/server/index.mjs", "--port", "8080"]