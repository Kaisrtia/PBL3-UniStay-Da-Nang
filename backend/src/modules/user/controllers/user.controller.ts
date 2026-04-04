import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as userService from '../service/user.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { account_role } from '@prisma/client';
import { AppError } from '../../../core/exceptions/AppError';

export const handleSetupProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }

  const { role, gender, dob, phone, avatarUrl } = req.body;

  const result = await userService.setupProfile(userId, {
    role: role as account_role,
    gender,
    dob,
    phone,
    avatarUrl
  });

  sendSuccess(
    res,
    HttpStatus.OK,
    {
      user: {
        id: result.id,
        email: result.email,
        phone: result.phone,
        fullName: result.fullName,
        status: result.status,
        roles: result.roles,
        avatarUrl: result.avatarUrl
      }
    },
    'Profile set up successfully'
  );
};
