FROM node:18-bullseye-slim

# Install system dependencies for health checks and Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Install Playwright browsers with system dependencies
RUN npx playwright install --with-deps chromium

COPY . .

# Create necessary directories
RUN mkdir -p /app/database /app/reports /app/screenshots /app/screenshots/baseline /app/screenshots/diff

# Set permissions
RUN chmod -R 755 /app

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/api/health || exit 1

CMD ["node", "server.js"]
