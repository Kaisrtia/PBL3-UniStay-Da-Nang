import { account_role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

export const authorize = (allowedRoles: account_role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasAllowedRole = req.user ? allowedRoles.includes(req.user.role) : false;

    if (!hasAllowedRole) {
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'You do not have permission to perform this action!'
      });
    }
    next();
  };
};
