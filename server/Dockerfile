# Uses the current Node.js LTS release as our base image
FROM node:22

# Goes to the app directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json .

# Install app dependencies. Runs when container is building image
RUN npm ci

# Copy the rest of our app into the container
COPY . .

# Compile TypeScript before starting the server
RUN npm run build

ENV PORT=5005

EXPOSE 5005

# Runs the app
CMD ["npm", "start"]
