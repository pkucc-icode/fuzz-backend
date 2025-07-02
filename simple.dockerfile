# Dockerfile
FROM node:20-alpine AS base

# Create an optimised runner image
FROM base AS runner
WORKDIR /app
COPY .output ./.output
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nitro
USER nitro
EXPOSE 8080
ENV PORT 8080
CMD ["node", ".output/server/index.mjs", "--port", "8080"]