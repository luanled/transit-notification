# Use Node official image as base
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose the port your backend server runs on
EXPOSE 3000

# Command to run the backend server
CMD ["npm", "run", "dev"]
