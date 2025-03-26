import { Server } from "socket.io";

let onlineUsers = {};

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-type"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("add-user", (userId) => {
      onlineUsers[userId] = socket.id;
      io.emit("online-user", Object.keys(onlineUsers));
    });

    socket.on("send-msg", (msg) => {
      console.log("Online User", onlineUsers);
      const { senderId, receiverId, content } = msg;
      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-msg", {
          senderId,
          receiverId,
          content,
        });
      }
    });

    socket.on("disconnect", () => {
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] == socket.id) {
          delete onlineUsers[userId];
          break;
        }
      }
      io.emit("online-user", Object.keys(onlineUsers));
    });
  });

  return io;
};

export default socketHandler;
