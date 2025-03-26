import zod from "zod";

// Register Schema
export const registerSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8).refine(
        (val) => {
            const hasUpperCase = /[A-Z]/.test(val);
            const hasLowerCase = /[a-z]/.test(val);
            const hasNumber = /[0-9]/.test(val);
            const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(val);
            return hasUpperCase && hasLowerCase && hasNumber && hasSymbol;
        },
        {
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one symbol",
        },
    ),
    name: zod.string().min(3),
});

// Login Schema
export const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8),
})

// Send Message Schema
export const messageSchema = zod.object({
    content: zod.string().min(1),
    receiverId: zod.number(),
});

// Edit Message Schema
export const editMessageSchema = zod.object({
    content: zod.string().min(1),
});

// Conversation History Schema
export const historySchema = zod.object({
    receiverId: zod.number().int(),
    beforeTime: zod.date().optional(),
    count: zod.number().int().min(1).max(100).optional(),
    sort: zod.enum(['asc', 'desc']).optional(),
  });

// Log Schema
  export const logSchema = zod.object({
    startTime: zod.date().optional(),
    endTime: zod.date().optional(),
  });
  

// Search Message Schema
export const searchMessageSchema = zod.object({
    message: zod.string().min(1).optional(),
    receiverId: zod.number().int(),
    page: zod.number().int().min(1).optional(),
    count: zod.number().int().min(1).max(100).optional(),
    sort: zod.enum(['asc', 'desc']).optional(),
  });