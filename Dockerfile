# 1. Base image
FROM node:18-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy files
COPY package*.json ./
RUN npm install

COPY . .

# 4. Build Next.js app
RUN npm run build

# 5. Use smaller image for production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003

# Copy only necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3003

CMD ["npx", "next", "start", "-p", "3003"]
