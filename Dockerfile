# --- Stage 1: Build the TypeScript code ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including typescript compiler)
RUN npm ci

# Copy source code
COPY src ./src

# Build production JS files
RUN npm run build

# --- Stage 2: Create production runner container ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set node environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled files from stage 1
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (corresponds to backend port in .env)
EXPOSE 5001

# Start the Node backend application
CMD ["npm", "start"]
