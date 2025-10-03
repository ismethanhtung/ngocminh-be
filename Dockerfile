# Simple Dockerfile cho Ngọc Minh Medical Backend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Skip TypeScript build for now - run directly with ts-node

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3000

# Start the application with ts-node
CMD ["npx", "tsx", "src/index.ts"]
