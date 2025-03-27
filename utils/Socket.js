import { Server } from "socket.io";

let onlineUsers = {}; // Initially Empty Object

const socketHandler = (server) => {
  // Cors Configuration
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-type"],
      credentials: true,
    },
  });

  // Trigger When Socket Connect
  io.on("connection", (socket) => {
    // Add User Event Listen
    socket.on("add-user", (userId) => {
      onlineUsers[userId] = socket.id;
      // Emit Online User after Adding User
      io.emit("online-user", Object.keys(onlineUsers));
    });

    // Send Message Event Listen
    socket.on("send-msg", (msg) => {
      const { senderId, receiverId, content } = msg;
      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        // If Receiver is Online Emit Message to Receiver Socket ID
        io.to(receiverSocketId).emit("receive-msg", {
          senderId,
          receiverId,
          content,
        });
      }
    });

    // Event Listen When Socket Disconnect
    socket.on("disconnection", () => {
      for (const userId in onlineUsers) {
        // Socket Id matched with disconnected User Remove it from Online Users
        if (onlineUsers[userId] == socket.id) {
          delete onlineUsers[userId];
          break;
        }
      }
      // Emit Online User after Disconnect
      io.emit("online-user", Object.keys(onlineUsers));
    });
  });

  return io;
};

export default socketHandler;
