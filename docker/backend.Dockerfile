# CodeForge backend – multi-stage production image
FROM node:20-slim AS builder

WORKDIR /app

# Install all dependencies (including devDependencies like typescript) for compilation
COPY server/package.json server/package-lock.json* ./
RUN npm ci || npm install

COPY server/tsconfig.json ./
COPY server/src ./src

# Build TypeScript
RUN npm run build

# Runner stage: lean production runtime
FROM node:20-slim AS runner

WORKDIR /app

# Install only production dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
