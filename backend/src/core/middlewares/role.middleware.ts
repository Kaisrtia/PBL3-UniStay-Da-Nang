import { account_role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

export const authorize = (allowedRoles: account_role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.includes(allowedRoles[0])) {
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'You do not have permission to perform this action!'
      });
    }
    next();
  };
};
