# Use official Node.js image
FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application files
COPY . .

# Expose port 8080 for frontend
EXPOSE 8080

# Command to run the frontend server
CMD ["pnpm", "run", "serve"]
