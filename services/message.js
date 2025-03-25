import { prisma } from "../utils/PrismaClient.js";

// Create Message Service
export const createMessage = async (data) => {
    try {
      const message = await prisma.chatMessages.create({
        data: {
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
        },
      });
      
      return message;
    } catch (error) {
      throw error;
    }
  };


// Edit Message Service
  export const editMessageOfSender = async (id, data) => {
    try {
      const message = await prisma.chatMessages.update({
        where: {id},
        data: {
          content: data.content,
          updatedAt: new Date(),
        },
      });
      return message;
    } catch (error) {
      throw error;
    }
  };


  // Find Message by Sender Id Service
  export const findMessageById = async (id) => {
    try {
      const message = await prisma.chatMessages.findFirst({
        where: {
          id: id,
          // senderId: senderId,
        },
      });
      return message;
    } catch (error) {
      throw error;
    }
  }

  // Delete Message Service
  export const deleteMessageOfSender = async (id) => {
    try {
      // Soft Delete
      const message = await prisma.chatMessages.update({   // For Soft Delete We are updating
        where: {id},
        data: {
          deletedAt: new Date(),
          isDeleted: true
        },
      });
      return message;
    } catch (error) {
      throw error;
    }
  };