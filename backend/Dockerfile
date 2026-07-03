# Use Node.js 20 LTS Slim image for a secure container with glibc compatibility
FROM node:20-slim

# Set build-time node environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install unzip (required to extract chrome zip files) and ca-certificates (required to download over HTTPS)
RUN apt-get update && apt-get install -y \
    unzip \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies (only production if NODE_ENV is production)
RUN if [ "$NODE_ENV" = "production" ]; then \
      PUPPETEER_SKIP_DOWNLOAD=true npm ci --only=production; \
    else \
      PUPPETEER_SKIP_DOWNLOAD=true npm ci; \
    fi

# Install Chrome Headless Shell and let Puppeteer install all system libraries automatically
RUN apt-get update && npx puppeteer browsers install chrome-headless-shell --install-deps && rm -rf /var/lib/apt/lists/*

# Copy application source code
COPY . .

# Expose port (default is 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
