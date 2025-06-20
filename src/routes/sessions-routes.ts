import { Router, Request, Response, NextFunction } from 'express';
import { sessionsController } from '../controllers/sessions-controller';

const sessionsRoutes = Router();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

sessionsRoutes.post('/login', asyncHandler(sessionsController.login.bind(sessionsController)));
sessionsRoutes.post('/refresh-token', asyncHandler(sessionsController.refreshToken.bind(sessionsController)));
sessionsRoutes.post('/logout', asyncHandler(sessionsController.logout.bind(sessionsController)));

export { sessionsRoutes };
