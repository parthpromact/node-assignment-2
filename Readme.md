# Node JS User Login, Register and Chat Service

This is a Node JS based user login, register and chat service. It uses Express JS as the web framework and Prisma as the ORM tool.

## Features

- User Registration
- User Login
- All Users for Chat
- Send Message
- Edit Message
- Delete Message
- Message History
- User Logs

## Tech Stack

- Node JS
- Express JS
- Prisma
- MySQL
- JWT
- Bcrypt

## Installation

- Clone the repository
- Run `npm install` to install all the dependencies
- Create a MySQL database and update the database connection string in the `.env` file
- Run `npx prisma migrate dev` to create the database schema
- Run `npm start` to start the server

## API Endpoints

- **POST /register**: Register a new user
  - Request Body: `email`, `name`, `password`
  - Response: `token`, `userData` (user details without password)
- **POST /login**: Login a user
  - Request Body: `email`, `password`
  - Response: `token`, `userData` (user details without password)
- **POST /messages**: Send a message from one user to another
  - Request Body: `receiverId`, `content`
  - Response: `messageId`
- **GET /messages**: Get the conversation history between two users
  - Request Query: `receiverId`
  - Response: `messages` (array of messages)
- **PUT /messages/:messageId**: Edit a message
  - Request Body: `content`
  - Response: `messageId`
- **DELETE /messages/:messageId**: Delete a message
  - Response: `messageId`
- **GET /logs**: Get the logs of a user
  - Request Query: `startTime`, `endTime`
  - Response: `logs` (array of logs)

## Environment Variables

- `PORT`: The port number to run the server on
- `JWT_SECRET`: The secret key for generating JWT tokens
- `JWT_EXPIRES_IN`: The expiration time for JWT tokens
- `DATABASE_URL`: The connection string for the PostgreSQL database
- `DEFINE_DURATION`: Maximun limit of Request in Particular Duration
- `MAX_REQUEST`: No of Requests in Defined Duration

## Author

- Parth
