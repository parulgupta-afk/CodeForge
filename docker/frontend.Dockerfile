# CodeForge frontend – production image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm ci || npm install

# Copy source and config
COPY client/tsconfig.json client/tsconfig.node.json* ./
COPY client/vite.config.ts client/index.html ./
COPY client/src ./src

# Optional env variables during build
ARG VITE_API_URL=""
ARG VITE_WS_URL=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build client bundle
RUN npm run build

# Production static server with Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
