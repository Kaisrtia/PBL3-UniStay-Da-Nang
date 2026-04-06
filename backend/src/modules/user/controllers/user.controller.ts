import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as userService from '../service/user.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { account_role } from '@prisma/client';

export const handleSetupProfile = async (req: Request, res: Response) => {
  const { role, gender, dob, phone, avatarUrl } = req.body;

  const result = await userService.setupProfile(req.user!, {
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
        avatarUrl: result.avatarUrl,
        dob: result.dob,
        gender: result.gender,
        roles: result.roles
      }
    },
    'Profile set up successfully'
  );
};

export const handleChangePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await userService.changePassword(req.user!, currentPassword, newPassword);

  sendSuccess(res, HttpStatus.OK, null, 'Password changed successfully');
};

export const handleBanUser = async (req: Request, res: Response) => {
  const admin = req.user!;
  const userId = req.body.userId;

  await userService.banUser(admin, userId);

  sendSuccess(res, HttpStatus.OK, null, 'User banned successfully');
};

