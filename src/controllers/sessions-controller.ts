import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { authConfig } from '../configs/auth';
import { UserStatus } from '@prisma/client';

// Zod schema para login
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'A palavra-passe deve ter pelo menos 6 caracteres' }),
});

class SessionsController {
  // LOGIN
  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email } });
      // se o user não existir ou o status for inactivo, retorna um erro
      if (!user || user.status === UserStatus.inactivo) {
        return res.status(401).json({ error: 'Email ou palavra-passe incorreta.' });
      }
   
      // Verifica se a senha fornecida corresponde à senha armazenada
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou palavra-passe incorreta' });
      }
      // Gera access token
      const accessToken = jwt.sign(
        { role: user.role, sub: user.id.toString() },
        authConfig.jwt.secret as Secret,
        { expiresIn: String(authConfig.jwt.expiresIn) } as SignOptions
      );
      // Gera refresh token
      const refreshToken = jwt.sign(
        { sub: user.id.toString() },
        authConfig.jwt.refreshSecret as Secret,
        { expiresIn: String(authConfig.jwt.refreshExpiresIn) } as SignOptions
      );
      // Salva refresh token no banco
      const expiresAt = new Date(Date.now() + this.msFromExpiresIn(authConfig.jwt.refreshExpiresIn));
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });
      // Em desenvolvimento, cookie visível no browser
      res.cookie(authConfig.jwt.refreshCookieName, refreshToken, {
        httpOnly: false, // Em produção: true
        secure: false,   // Em produção: true
        sameSite: 'lax', // Em produção: 'strict'
        expires: expiresAt,
        // Produção:
        // httpOnly: true,
        // secure: true,
        // sameSite: 'strict',
      });
      // Retorna access token (em memória) e usuário (sem senha)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ accessToken, user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao autenticar.' });
    }
  }

  // REFRESH TOKEN
  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[authConfig.jwt.refreshCookieName];
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token não encontrado.' });
      }
      let payload: any;
      try {
        payload = jwt.verify(refreshToken, authConfig.jwt.refreshSecret);
      } catch {
        return res.status(401).json({ error: 'Refresh token inválido.' });
      }
      // Verifica se o refresh token existe no banco
      const tokenInDb = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Refresh token expirado ou não encontrado.' });
      }
      // Gera novo access token
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return res.status(401).json({ error: 'Utilizador não encontrado.' });
      }
      const accessToken = jwt.sign(
        { role: user.role, sub: user.id.toString() },
        authConfig.jwt.secret as Secret,
        { expiresIn: String(authConfig.jwt.expiresIn) } as SignOptions
      );
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ accessToken, user: userWithoutPassword });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao renovar sessão.' });
    }
  }

  // LOGOUT
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[authConfig.jwt.refreshCookieName];
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        // Em desenvolvimento, cookie visível no browser
        res.clearCookie(authConfig.jwt.refreshCookieName, {
          httpOnly: false, // Em produção: true
          secure: false,   // Em produção: true
          sameSite: 'lax', // Em produção: 'strict'
          // Produção:
          // httpOnly: true,
          // secure: true,
          // sameSite: 'strict',
        });
      }
      return res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao realizar logout.' });
    }
  }

  // Utilitário para converter expiresIn (ex: '7d', '1h') para ms
  private msFromExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }
}

export const sessionsController = new SessionsController();
