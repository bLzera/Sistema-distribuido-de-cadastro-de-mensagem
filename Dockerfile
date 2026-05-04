FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server.js db.js ./
COPY public/ ./public/
RUN mkdir -p /data
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.js"]
