# Use Node.js 18 official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for tsx and cross-env)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Railway will override this with PORT env var)
EXPOSE 8080

# Start the application in development mode (works best for this setup)
ENV NODE_ENV=development
ENV PORT=8080
CMD ["npm", "run", "dev"]