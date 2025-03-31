
import { createUser, getUserByEmail, updateUser } from "../services/user.js";
import { prisma } from "../utils/PrismaClient.js";
import httpResponse from "../utils/response.js";
import { loginSchema, registerSchema } from "../utils/Validator.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

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

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,     
  process.env.GOOGLE_CLIENT_SECRET, 
  process.env.GOOGLE_REDIRECT_URI 
);

export const getGoogleAuthUrl = (req, res) => {
  try {
    // Generate the authorization URL with precise parameters
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',     
      prompt: 'consent',          
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'                  
      ],
      response_type: 'code',
      state: crypto.randomUUID() 
    });

    return httpResponse(res, 200, "Google Auth URL generated", { 
      authUrl: url 
    });
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    return httpResponse(res, 500, "Error generating authentication URL", { 
      errorDetails: error.message 
    });
  }
};

export const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    // If you want to Test this api then uncomment this
    // return httpResponse(res, 200, "Code Received", { code });

    // Create OAuth2 client with EXACT same redirect URI
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    // Verify the token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    // Get the payload from the verified token
    const payload = ticket.getPayload();
    const { 
      email, 
      name, 
      sub: googleId, 
      email_verified: emailVerified 
    } = payload;

    // Verify email
    if (!email || !emailVerified) {
      return httpResponse(res, 400, "Invalid Google authentication");
    }

    // Your existing user creation/login logic
    let existingUser = await getUserByEmail(email);

    if (!Object.keys(existingUser).length || !existingUser) {
      existingUser = await createUser({
        email,
        name,
        googleId
      });
    } else {
      existingUser = await updateUser({
        email,
        name,
        googleId
      }, existingUser.id);
     
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userData: {
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    // Redirect with token
    return res.redirect(`http://localhost:3000/oauth2callback?token=${encodeURIComponent(token)}`);

  } catch (error) {
    console.error('Google Callback Error:', error);
    return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(error.message)}`);
  }
};

export const handleGoogleLoginSignUps = async (req, res) => {
  try {
    const { token, type } = req.body;

    // Verify the token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    // Get the payload from the verified token
    const payload = ticket.getPayload();
    const { 
      email, 
      name, 
      sub: googleId, 
      email_verified: emailVerified 
    } = payload;

    // Verify email
    if (!email || !emailVerified) {
      return httpResponse(res, 400, "Invalid Google authentication");
    }

    // Your existing user creation/login logic
    let existingUser = await getUserByEmail(email);

    // if user is already registered and request is for register validation
    if(existingUser && type === 'register') {
      return httpResponse(res, 200, "You're already registered! Please Login");
    }

    // if user is already registered and request is for login 
    if (existingUser && type === 'login') {
      existingUser = await updateUser({
        email,
        name,
        googleId
      }, existingUser.id);
    }

    // if user is not registered and request is for register
    if (!existingUser && type == 'register') {
      existingUser = await createUser({
        email,
        name,
        googleId
      });
    } 

    // if user is not registered and request is for login validation
    if(!existingUser && type === 'login') {
      return httpResponse(res, 200, "You're not registered! Please Register");
    }

    // Generate JWT token
    let userData = {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name
  }

  const tokens = jwt.sign(
    { userData }, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
    // Redirect with token
    return httpResponse(res, 200, "Google Logged In Successfully", type == 'register' ? userData : { tokens, userData });

  } catch (error) {
    console.error('Google Callback Error:', error);
    return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(error.message)}`);
  }
};





