import { prisma } from "../utils/PrismaClient.js";

// Create User Services
export const createUser = async (data) => {
  try {
    const user = await prisma.users.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Get User By Email Services
export const getUserByEmail = async (email) => {
  try {
    const user = await prisma.users.findUnique({ where: { email: email } });
    return user;
  } catch (error) {
    throw error;
  }
};

// Get User By Id
export const getUserById = async (id) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: id } });
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (data, id) => {
  try {
    const user = await prisma.users.update({
      data: {
        email: data?.email,
        name: data?.name,
        password: data?.password,
        googleId: data?.googleId
      },
      where: { id: id },
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};
