import 'express';
import { Multer } from 'multer';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
            
            files?: Multer.File[];
        }
    }
}