# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TS -> dist
RUN npm run build


# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output
COPY --from=build /app/dist ./dist

# If you have any runtime files (e.g. templates), copy them here as well
# COPY --from=build /app/some-folder ./some-folder

EXPOSE 4000

CMD ["node", "dist/server.js"]
