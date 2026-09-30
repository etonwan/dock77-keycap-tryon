# Stage 1: build the web page (needs dev dependencies like Vite and TypeScript).
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: the running server, with only production dependencies.
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server.js tryon.js describe.js keysheet.js image.js prompt.js ./
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "server.js"]
