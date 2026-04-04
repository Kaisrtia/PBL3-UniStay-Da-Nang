import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.roles.toString())) {
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'You do not have permission to perform this action!'
      });
    }
    next();
  };
};
