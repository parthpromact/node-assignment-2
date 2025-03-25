
import { createUser, getUserByEmail } from "../services/user.js";
import { prisma } from "../utils/PrismaClient.js";
import httpResponse from "../utils/response.js";
import { loginSchema, registerSchema } from "../utils/Validator.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation If Email, Name and Password are required
    if (!email || !name || !password) {
        return httpResponse(res, 400, "Email, Name and Password are Required")
    }

    // Validation using Zod
    const validated = await registerSchema.safeParse(req.body);
    if (!validated.success) {
        return httpResponse(res, 400, "Registration failed due to validation errors", validated.error.errors);
    }

    // Validation If Email already exists
    if (email) {
      const existingEmail = await getUserByEmail(email);
      if (existingEmail) {
        return httpResponse(res, 409, "Registration failed because the email is already registered");
      }
    }
   
    // Hashing Password Using Bycrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Register User In Database
    const user = await createUser(
       {
        email,
        name,
        password : hashedPassword,
      },
    );

    // Prepare User Data without Password
    let userData = {
        userId: user.id,
        email: user.email,
        name: user.name
    }
    
    return httpResponse(res, 201, "Registration successful", userData);
  } catch (error) {
    return httpResponse(res, 500, "Internal Server Error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

     // Validation If Email, Name and Password are required
    if (!email || !password) {
        return httpResponse(res, 400, "Email and Password are Required")
    }

     // Validation using Zod
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
        return httpResponse(res, 400, "Login failed due to validation errors", validated.error.errors);
    }

    // Check Email is Exist or Not
    const existEmail = await getUserByEmail(email);
    if (!existEmail) {
        return httpResponse(res, 404, "Email does not Exist, Please Register")
    }

    // Compare With Hashed Password
    const hashedPassword = existEmail.password;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    // Paasword is Invalid
    if (!isPasswordValid) {
        return httpResponse(res, 401, "Login failed due to incorrect credentials")
    }

     // Prepare User Data without Password
    let userData = {
        userId: existEmail.id,
        email: existEmail.email,
        name: existEmail.name
    }

    // On Success token and user data
    const token = jwt.sign(
        { userData },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN}
    );

    return httpResponse(res, 200, "Login successful", { token, userData });
  } catch (error) {
    return httpResponse(res, 500, "Internal Server Error");
  }
};

export const getUsers = async (req, res) => {
    try {
        // From Token Fetching User 
        const { userId } = req.user;
    
        if(!userId) {
            return httpResponse(res, 401, "Unauthorized access: No Token Provided");
        }

        // Fetching Users Except Current User
        const users = await prisma.users.findMany({
            where: {
                NOT: {
                    id: userId
                }
            }
        });
       
        return httpResponse(res, 200, "User list retrieved successfully", users);
    } catch (error) {
        return httpResponse(res, 500, "Internal Server Error");
    }
}
