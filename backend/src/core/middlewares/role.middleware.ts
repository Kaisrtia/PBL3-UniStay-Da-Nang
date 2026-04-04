import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';
import { account_role } from '@prisma/client';

export const authorize = (allowedRoles: account_role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.roles)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'You do not have permission to perform this action!'
      });
    }
    next();
  };
};
