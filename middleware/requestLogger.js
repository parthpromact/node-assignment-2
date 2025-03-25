import { prisma } from "../utils/PrismaClient.js";
export const requestLogger = async (req, res, next) => {

    const ip = req.ip.includes('::ffff:') ? req.ip.replace('::ffff:','') : req.ip;
    const body = req.body;
    const time = new Date();
    const username = req.user ? req.user.name : null;
    const userId = req.user ? req.user.userId    : null;
    const route = req.originalUrl;
    const method = req.method;
    const formattedTime = time.toISOString();

    // Create Log Entry in Database
    await prisma.logs.create({
        data: {
            ip: ip,
            body: body,
            timeofcall: formattedTime,
            username: username,
            route: route,
            userId: userId,
            method: method
        }
    })

    // Print Log in Console
    res.on("finish", () => {
        console.log(`IP: ${ip}, Body: ${body}, Time: ${formattedTime}, Username: ${username}, Route: ${route}`);
    });

    next();
}