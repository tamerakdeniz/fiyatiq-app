# Use an official Node.js runtime as a parent image
FROM node:22-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Build the Next.js application
RUN npm run build

# Create a new stage for a smaller production image
FROM node:22-alpine AS production

WORKDIR /app

# Copy the build output from the 'base' stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]
