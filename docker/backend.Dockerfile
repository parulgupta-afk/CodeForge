# CodeForge backend – production image
FROM node:20-slim

WORKDIR /app

# Install only production deps first for better caching
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

COPY server/tsconfig.json ./
COPY server/src ./src

# Build TypeScript
RUN npx tsc

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
