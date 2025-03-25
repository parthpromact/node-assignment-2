import { prisma } from "../utils/PrismaClient.js";
import httpResponse from "../utils/response.js";
import { logSchema } from "../utils/Validator.js";

export const fetchLogs = async (req, res) => {
    try {
      const { userId } = req.user;
      const endTime = req?.query?.endTime ? new Date(Date.parse(req.query.endTime)) : new Date();
      const startTime = req?.query?.startTime ? new Date(Date.parse(req.query.startTime) - 5 * 60 * 1000) : new Date(endTime.getTime() - 5 * 60 * 1000);
     
      // Validate Request
      const result = logSchema.safeParse({ endTime, startTime });

      if (!result.success) {
         return httpResponse(res, 400, "Invalid request parameters", result.error.errors);
      }

      // Token is not Provided
      if (!userId)  {
          return httpResponse(res, 401, "Unauthorized: No Token Provided");
      }
  
      const logs = await prisma.logs.findMany({
        where: {
            userId: userId,
            timeofcall: {
               gte: startTime,
               lte: endTime
            }
        },
        orderBy: {
            timeofcall: 'asc',
        },
      });
   
      // if Meesage is not found
      // if (logs.length === 0) {
      //   return httpResponse(res, 404, "Logs not Found");
      // }
  
      return httpResponse(res, 200, "Logs fetched Successfully", logs);
    } catch (error) { 
      return httpResponse(res, 500, "Internal server error");
    }
  };