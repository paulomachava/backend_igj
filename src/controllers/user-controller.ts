import { prisma } from '../lib/prisma';
import { z } from 'zod';
import bcrypt, { hash } from 'bcrypt';
import { UserStatus, UserRole } from '@prisma/client'; // Correctly import UserStatus

import { Request, Response } from 'express';

// Define Zod schemas
const userSchema = z.object({
  name: z.string({ required_error: 'O nome é obrigatório' }).min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Endereço de email inválido' }),
  password: z.string().min(6, { message: 'A palavra-passe deve ter pelo menos 6 caracteres' }),
  role: z.enum([UserRole.admin, UserRole.gestor, UserRole.tecnico], { message: 'Função inválida' }).default(UserRole.tecnico),
  status: z.enum([UserStatus.activo, UserStatus.inactivo], { message: 'Estado inválido' }).default(UserStatus.activo),
});

/**
 * UsersController handles all user-related operations, including fetching, creating, updating, and deleting users.
 */
class UsersController {
  /**
   * Fetches all users from the database.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  getUsers = async (req: Request, res: Response) => {
    try {
      // Pega page e pageSize dos query params, com valores padrão
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      // Busca usuários paginados
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take,
        }),
        prisma.user.count(),
      ]);

      res.status(200).json({
        data: users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          pageSize,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  /**
   * Fetches a single user by their ID.
   * @param req - Express request object containing the user ID in params.
   * @param res - Express response object.
   */
  getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  /**
   * Creates a new user in the database.
   * @param req - Express request object containing user data in the body.
   * @param res - Express response object.
   */
  createUser = async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, status } = userSchema.parse(req.body);

        //check if user already exists
      const existingUser = await prisma.user.findUnique({ 
        where: { email } 
      });
      if (existingUser) {
        return res.status(409).json({ error: 'Utilizador já existe' });
      }
      
      //hash password
      const hashedPassword = await bcrypt.hash(password, 10);


      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          status,
          lastLogin: new Date().toISOString(),
          createdBy: req.user?.id || null, // Assuming req.user contains the authenticated user's info
        },
      });

      // Remove password from user object before sending response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  };

  /**
   * Updates an existing user in the database.
   * @param req - Express request object containing the user ID in params and updated data in the body.
   * @param res - Express response object.
   */
  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, role, password,status } = req.body;
      
      // Check if user exists
      const userExists = await prisma.user.findUnique({
        where: { id }
      })
      
      if (!userExists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Prepare update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      
      // If password is provided, hash it
      if (password) {
      
        updateData.password = await hash(password, 10);
      }  
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updateAt: true
        }
      })
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  

  /**
   * Deletes a user from the database.
   * @param req - Express request object containing the user ID in params.
   * @param res - Express response object.
   */
  deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.user.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
  //filter users by role
  filterUsersByRole = async (req: Request, res: Response) => {
    let { role } = req.query;
    if (typeof role !== 'string' || !Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ error: 'Role inválido' });
    }
    const users = await prisma.user.findMany({ where: { role: role as UserRole } });
    return res.status(200).json(users);
  }
  //filter users by status
  filterUsersByStatus = async (req: Request, res: Response) => {
    let { status } = req.query;
    if (typeof status !== 'string' || !Object.values(UserStatus).includes(status as UserStatus)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    const users = await prisma.user.findMany({ where: { status: status as UserStatus } });
    return res.status(200).json(users);
  }
}

  
export { UsersController };