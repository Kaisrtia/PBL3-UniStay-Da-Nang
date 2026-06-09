import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as userInfoService from '../service/userInfo.service';
import * as adminService from '../service/admin.service';
import * as blockService from '../service/block.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { toUserResponseDto } from '../dto/user-response.dto';
import { AppError } from '../../../core/exceptions/AppError';

// -- User Info --

export const handleGetUserInfo = async (req: Request, res: Response) => {
  const user = await userInfoService.getUserProfile(req.user!.id);
  sendSuccess(res, HttpStatus.OK, user);
};

export const handleGetUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User ID is required');
  }

  const profile = await userInfoService.getUserProfile(id);
  sendSuccess(res, HttpStatus.OK, profile);
};

export const handleSetupProfile = async (req: Request, res: Response) => {
  const { role, dob, phone, gender, universityId } = req.body;

  const result = await userInfoService.setupProfile(req.user!, {
    role,
    dob,
    phone,
    gender,
    universityId
  });

  sendSuccess(res, HttpStatus.OK, toUserResponseDto(result));
};

export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { full_name, fullName, phone, dob, gender, avatarUrl, universityId } =
    req.body;

  const result = await userInfoService.updateProfile(req.user!, {
    fullName: full_name || fullName,
    phone,
    dob,
    gender,
    avatarUrl,
    universityId
  });

  sendSuccess(
    res,
    HttpStatus.OK,
    toUserResponseDto(result),
    'Đã cập nhật thông tin cá nhân.'
  );
};

export const handleChangePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await userInfoService.changePassword(req.user!, currentPassword, newPassword);

  sendSuccess(res, HttpStatus.OK, null, 'Password changed successfully');
};

// -- Block Users --

export const handleGetBlockedUsers = async (req: Request, res: Response) => {
  const blockedUsers = await blockService.listBlockedUsers(req.user!);
  sendSuccess(
    res,
    HttpStatus.OK,
    blockedUsers,
    'Blocked users fetched successfully'
  );
};

export const handleBlockUser = async (req: Request, res: Response) => {
  const { blockedId } = req.body;

  if (typeof blockedId !== 'string') {
    throw new AppError(HttpStatus.BAD_REQUEST, 'blockedId is required');
  }

  const block = await blockService.blockUser(req.user!, blockedId);
  sendSuccess(res, HttpStatus.CREATED, block, 'User blocked successfully');
};

export const handleUnblockUser = async (req: Request, res: Response) => {
  const { blockedId } = req.params;

  if (!blockedId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'blockedId is required');
  }

  await blockService.unblockUser(req.user!, blockedId);
  sendSuccess(res, HttpStatus.OK, null, 'User unblocked successfully');
};

// -- User Management --

export const handleBanUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  await adminService.banUser(userId);

  sendSuccess(res, HttpStatus.OK, null, 'User banned successfully');
};

export const handleUnbanUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  await adminService.unbanUser(userId);

  sendSuccess(res, HttpStatus.OK, null, 'User unbanned successfully');
};

// -- Host Management --

export const handleVerifyHost = async (req: Request, res: Response) => {
  const { hostId } = req.body;

  if (!hostId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'hostId is required');
  }

  const verifiedHost = await adminService.verifyHost(hostId);

  sendSuccess(
    res,
    HttpStatus.OK,
    verifiedHost,
    'Host verified successfully (Blue Tick granted)'
  );
};

export const handleGetVerificationCandidates = async (
  req: Request,
  res: Response
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await userInfoService.getVerificationCandidates(page, limit);
  sendSuccess(res, HttpStatus.OK, result);
};

export const handleGetAllUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await adminService.getAllUsers(page, limit);
  sendSuccess(res, HttpStatus.OK, result);
};
