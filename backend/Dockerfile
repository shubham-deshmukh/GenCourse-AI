# Use Node.js 20 LTS Slim image for a secure container with glibc compatibility
FROM node:20-slim

# Set build-time node environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Set working directory inside the container
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies (only production if NODE_ENV is production)
RUN if [ "$NODE_ENV" = "production" ]; then \
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --only=production; \
    else \
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci; \
    fi

# Install Chrome Headless Shell and let Puppeteer install all system libraries automatically
RUN npx puppeteer browsers install chrome-headless-shell --install-deps

# Copy application source code
COPY . .

# Expose port (default is 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
