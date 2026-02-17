# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
# This runs 'vite build' (client) and 'esbuild' (server) as defined in package.json
RUN npm run build

# Run stage
FROM node:20-slim

WORKDIR /app

# Copy built files and source files needed for tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Set environment to production
ENV NODE_ENV=production

# Expose the port (app always listens on 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
