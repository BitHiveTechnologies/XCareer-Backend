# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/templates ./dist/templates

# Ensure the app runs as a non-root user
RUN addgroup -S nodeuser && adduser -S nodeuser -G nodeuser
USER nodeuser

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]
