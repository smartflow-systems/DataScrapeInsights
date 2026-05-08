FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
RUN addgroup -S sfs && adduser -S sfsapp -G sfs
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=sfsapp:sfs /app/dist ./dist
COPY --chown=sfsapp:sfs server ./server
COPY --chown=sfsapp:sfs shared ./shared
USER sfsapp
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1
CMD ["npx", "tsx", "server/index.ts"]
