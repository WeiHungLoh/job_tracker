# Uses node version 22 as our base image
FROM node:23

# Goes to the app directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json .

# Install app dependencies. Runs when container is building image
RUN npm install

# Copy the rest of our app into the container
COPY . .

ENV PORT=3000

EXPOSE 3000

# Runs the app
CMD ["npm", "start"]
