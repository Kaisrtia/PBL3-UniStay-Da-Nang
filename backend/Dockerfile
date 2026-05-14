# Pipeline: parent image -> source code -> install dependencies -> run the application
# Use an official Node.js runtime as a parent image
FROM node:20-alpine
# Set the working directory in the container to /app
WORKDIR /app
# Because node:20-alpine image is based on alpine,
# it does not have openssl package, which is required by Prisma.
# So we need to install it before installing dependencies
RUN apk add --no-cache openssl
COPY package*.json .
# Install any needed packages specified in package.json
# Doing this so that if there are changes in source code, 
# the dependencies will not be reinstalled and the build process will be faster
RUN npm install 
# Copy all files have same level with Dockerfile to /app in container
# First dot means current directory
# Second dot means destination directory in container
COPY . . 
RUN npx prisma generate
# Make port 6969 available to the world outside this container
EXPOSE 6969
CMD ["npm", "run", "dev"]