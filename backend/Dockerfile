# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the backend code to the working directory
COPY backend/ ./backend/

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define the command to run the app
CMD [ "npm", "start" ]