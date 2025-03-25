# Image Node
FROM Node:22

# Select app directory
WORKDIR /app

# Copy Package.Json 
COPY package.json .

# Install Dependencies
RUN npm install

# Copy Files
COPY . .

# Expose Port
EXPOSE 5000

# Run App
CMD ["npm", "run","dev"]