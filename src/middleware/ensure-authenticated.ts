import { Request, Response, NextFunction } from 'express';
import { authConfig } from '../configs/auth';
import jwt from 'jsonwebtoken';
const { verify } = jwt;
import { prisma } from '../lib/prisma';
import { UserStatus } from '@prisma/client';


interface TokenPayload{
    role:string,
    sub:string
  }

/**
 * Middleware to ensure the user is authenticated.
 *
 * This middleware checks for the presence of a valid JWT token in the Authorization header.
 * It verifies the token, retrieves the user from the database, and ensures the user is active.
 * If the user is inactive or the token is invalid, it returns an appropriate error response.
 *
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {void} - Proceeds to the next middleware if authentication is successful.
 */
async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    try {
    const authHeader = req.headers.authorization;   
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    const [, token] = authHeader.split(' ');  
    const{role,sub:userId}=verify(token, authConfig.jwt.secret) as { role: string; sub: string } as TokenPayload;
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select:{status:true}
    });

    if (!user) {
        return res.status(401).json({ error: 'Token inválido' });
    }
    //update last acess regardless of the status
    await prisma.user.update({
        where: { id: userId },
        data: {
            lastLogin: new Date().toISOString(), 
            updateAt: new Date().toISOString()
        },
    });
    // Check if user is active  
    if (user.status === UserStatus.inactivo) {
        return res.status(403).json({ error: 'Conta inactiva. Entre em contato com o administrador.' })
    }
    req.user = {
        id: userId,
        role: role
    }
    next();
} catch (error) {
    return res.status(401).json({ error: 'Token inválido' });

}
}
export { ensureAuthenticated };