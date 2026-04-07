import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as userInfoService from '../service/userInfo.service';
import * as adminService from '../service/admin.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { toUserResponseDto } from '../dto/user-response.dto';
import { AppError } from '../../../core/exceptions/AppError';

// -- User Info --

export const handleGetUserInfo = async (req: Request, res: Response) => {
  const user = toUserResponseDto(req.user!);
  sendSuccess(res, HttpStatus.OK, user);
};

export const handleSetupProfile = async (req: Request, res: Response) => {
  const { role, gender, dob, phone, avatarUrl, universityId } = req.body;

  const result = await userInfoService.setupProfile(req.user!, {
    role,
    gender,
    dob,
    phone,
    avatarUrl,
    universityId
  });


  sendSuccess(res, HttpStatus.OK, toUserResponseDto(result));
};

export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { full_name, dob, gender, avatarUrl, universityId } = req.body;

  const result = await userInfoService.updateProfile(req.user!, {
    fullName: full_name,
    dob,
    gender,
    avatarUrl,
    universityId
  });

  sendSuccess(res, HttpStatus.OK, toUserResponseDto(result), 'Profile updated successfully');
};

export const handleChangePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await userInfoService.changePassword(req.user!, currentPassword, newPassword);

  sendSuccess(res, HttpStatus.OK, null, 'Password changed successfully');
};

// -- User Management --

export const handleBanUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  await adminService.banUser(req.user!, userId);

  sendSuccess(res, HttpStatus.OK, null, 'User banned successfully');
};

export const handleUnbanUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  await adminService.unbanUser(req.user!, userId);

  sendSuccess(res, HttpStatus.OK, null, 'User unbanned successfully');
};


