import { createMessage, deleteMessageOfSender, editMessageOfSender, findMessageById } from "../services/message.js";
import { getUserById } from "../services/user.js";
import { prisma } from "../utils/PrismaClient.js";
import httpResponse from "../utils/response.js";
import { editMessageSchema, historySchema, messageSchema, searchMessageSchema } from "../utils/Validator.js";

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { receiverId, content } = req.body;

    // Token is not Provided
    if (!userId)  {
        return httpResponse(res, 401, "Unauthorized access: No Token Provided");
    }

    // Validation using Zod
    const validated = messageSchema.safeParse(req.body);
    if (!validated.success) {
        return httpResponse(res, 400, "Message sending failed due to validation errors", validated.error.errors);
    }

    // You cannot send message to yourself
    if (userId === receiverId) {
        return httpResponse(res, 400, "You cannot send message to yourself");
    } 

    // Create Message Service Called
    const message = await createMessage({
      senderId: userId,
      receiverId: receiverId,
      content: content,
    });

    return httpResponse(res, 200, "Message sent Successfully", message);
  } catch (error) {
    return httpResponse(res, 500, "Internal server error");
  }
};

export const editMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    let { messageId } = req.params;
    messageId = parseInt(messageId);
    const { content } = req.body;

    // Token is not Provided
    if (!userId)  {
        return httpResponse(res, 401, "Unauthorized access: No Token Provided");
    }

    // Validation using Zod
    const validated = editMessageSchema.safeParse(req.body);
    if (!validated.success) {
        return httpResponse(res, 400, "Message editing failed due to validation errors", validated.error.errors);
    }

    // Find Message by Sender Id Servie Called
    const message = await findMessageById(messageId);
    if(!message) {
        return httpResponse(res, 404, "Mesage Not Found");
    }

    if(message.senderId !== userId) {
        return httpResponse(res, 401, "Unauthorized access: You Are Not Authorised to edit this Message");  
    }

    // Edit Message Service Called
    const updateMessage = await editMessageOfSender(messageId, {
            content: content
    })

    return httpResponse(res, 200, "Message edited successfully", updateMessage);
  } catch (error) {
    return httpResponse(res, 500, "Internal server error");
  }
};

export const deleteMessage = async (req, res) => {
    try {
      const { userId } = req.user;
      let { messageId } = req.params;
      messageId = parseInt(messageId);
  
      // Token is not Provided
      if (!userId)  {
          return httpResponse(res, 401, "Unauthorized access: No Token Provided");
      }
  
      // Find Message by Sender Id Servie Called
      const message = await findMessageById(messageId);
      if(!message) {
          return httpResponse(res, 404, "Mesage Not Found");
      }

      if(message.senderId !== userId) {
        return httpResponse(res, 401, "Unauthorized access: You Are Not Authorised to delete this Message");  
      }
  
      // SoftDelete Message Service Called
      const softDeleteMessage = await deleteMessageOfSender(messageId)

      return httpResponse(res, 200, "Message deleted successfully", softDeleteMessage);
    } catch (error) {
      return httpResponse(res, 500, "Internal server error");
    }
  };

export const retrieveConversationHistory = async (req, res) => {
    try {
      const { userId } = req.user;
      const receiverId = parseInt(req?.query?.receiverId);
      const beforeTime = req?.query?.beforeTime || new Date();
      const page = parseInt(req?.query?.page) || 1;
      const count = parseInt(req?.query?.count) || 20;
      const sort = req?.query?.sort == "asc" ? "asc" : "desc";
      // Parse Before Time
      const beforeTimeFormat =  new Date(Date.parse(beforeTime)).toISOString();

      // Validate Request 
      const result = historySchema.safeParse({ receiverId, beforeTimeFormat, count, sort });

      if (!result.success) {
         return httpResponse(res, 400, "Invalid request parameters", result.error.errors);
      }
     
      // Token is not Provided
      if (!userId)  {
          return httpResponse(res, 401, "Unauthorized access: No Token Provided");
      }

      // Check Receiver User Exist or Not
      const existUser = await getUserById(receiverId);
  
      if (!existUser) {
        return httpResponse(res, 404, "User not Found");
      }
  
    // try {
      const messages = await prisma.chatMessages.findMany({
        skip: (page - 1) * count,
        take: count,
        where: {
          senderId: { in: [userId, receiverId] },
          receiverId: { in: [userId, receiverId] },
          // createdAt: { lte: beforeTimeFormat },
          isDeleted: false
        },
        include: {
          sender: {
            select: {
              name: true
            }
          },
          receiver: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: sort,
        },
      });
      

      const messageCount = await prisma.chatMessages.count({
        where: {
          senderId: { in: [userId, receiverId] },
          receiverId: { in: [userId, receiverId] },
          // createdAt: { lte: beforeTimeFormat },
          isDeleted: false,
        },
      });

      const totalPage = Math.ceil(messageCount / count);
      const currentPage = page;

      const data = {
        messages: messages,
        totalPage: totalPage,
        currentPage: currentPage
      }
   
      // // if Meesage is not found
      // if (messages.length === 0) {
      //   return httpResponse(res, 404, "Conversation History not Found");
      // }
  
      return httpResponse(res, 200, "Conversation history retrieved successfully", data);
    } catch (error) { 
      return httpResponse(res, 500, "Internal server error");
    }
  };


  export const searchMessage = async (req, res) => {
    try {
      const { userId } = req.user;
      const search = req?.query?.message.toLowerCase() || '';
      const receiverId = parseInt(req?.query?.receiverId);
      const page = parseInt(req?.query?.page) || 1;
      const count = parseInt(req?.query?.count) || 20;
      const sort = req?.query?.sort == "asc" ? "asc" : "desc";

      // Validate Request 
      const result = searchMessageSchema.safeParse({ receiverId, search, count, sort });

      if (!result.success) {
        return httpResponse(res, 400, "Invalid request parameters", result.error.errors);
      }

      // Token is not Provided
      if (!userId)  {
          return httpResponse(res, 401, "Unauthorized access: No Token Provided");
      }

      // Search message from Database
      const messages = await prisma.chatMessages.findMany({
        skip: (page - 1) * count,
        take: count,
        where: {
          senderId: { in: [userId, receiverId] },
          receiverId: { in: [userId, receiverId] },
          content: {
            contains: search,
          },
          isDeleted: false
        },
        include: {
          sender: {
            select: {
              name: true
            }
          },
          receiver: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: sort,
        },  
      })
     
      // Message Page Count
      const messageCount = await prisma.chatMessages.count({
        where: {
          senderId: { in: [userId, receiverId] },
          receiverId: { in: [userId, receiverId] },
          content: {
            contains: search,
          },
          isDeleted: false
        },
      });

      const totalPage = Math.ceil(messageCount / count);
      const currentPage = page;

      const data = {
        messages: messages,
        totalPage: totalPage,
        currentPage: currentPage
      }

      return httpResponse(res, 200, "Search result retrieved successfully", data);
    } catch (error) { 
      return httpResponse(res, 500, "Internal server error");
    }
  };
