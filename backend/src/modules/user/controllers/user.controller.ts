import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as userInfoService from '../service/userInfo.service';
import * as adminService from '../service/admin.service';
import * as evaluationService from '../service/evaluation.service';
import * as studentService from '../service/student.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { toUserResponseDto } from '../dto/user-response.dto';
import { AppError } from '../../../core/exceptions/AppError';

// -- User Info --

export const handleGetUserInfo = async (req: Request, res: Response) => {
  const user = toUserResponseDto(req.user!);
  sendSuccess(res, HttpStatus.OK, user);
};

export const handleSetupProfile = async (req: Request, res: Response) => {
  const { role, gender, dob, phone, avatarUrl } = req.body;

  const result = await userInfoService.setupProfile(req.user!, {
    role,
    gender,
    dob,
    phone,
    avatarUrl
  });

  sendSuccess(res, HttpStatus.OK, toUserResponseDto(result));
};

export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { full_name, dob, gender, avatarUrl } = req.body;

  const result = await userInfoService.updateProfile(req.user!, {
    fullName: full_name,
    dob,
    gender,
    avatarUrl
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

// -- Evaluation --

export const handleCreateEvaluation = async (req: Request, res: Response) => {
  const { hostId, numberStar, description } = req.body;

  if (!hostId || !numberStar || !description) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'hostId, numberStar, and description are required');
  }

  const evaluation = await evaluationService.createEvaluation(req.user!, {
    hostId,
    numberStar: Number(numberStar),
    description
  });

  sendSuccess(res, HttpStatus.CREATED, evaluation, 'Evaluation submitted successfully');
};

export const handleCreateSystemFeedback = async (req: Request, res: Response) => {
  const { numberStar, description } = req.body;

  if (!numberStar || !description) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'numberStar and description are required');
  }

  const feedback = await evaluationService.createSystemFeedback(req.user!, {
    numberStar: Number(numberStar),
    description
  });

  sendSuccess(res, HttpStatus.CREATED, feedback, 'System feedback submitted successfully');
};

// -- Student Actions --

export const handleCreateStudentDemand = async (req: Request, res: Response) => {
  const {
    wardId,
    universityId,
    minPrice,
    maxPrice,
    roomType,
    isLookingForRoommate,
    roommateGender,
    rommateCriteria
  } = req.body;

  if (wardId === undefined || !universityId || minPrice === undefined || maxPrice === undefined || !roomType) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'wardId, universityId, minPrice, maxPrice, and roomType are required'
    );
  }

  const demand = await studentService.createStudentDemand(req.user!, {
    wardId: Number(wardId),
    universityId,
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    roomType,
    isLookingForRoommate: isLookingForRoommate === true || isLookingForRoommate === 'true',
    roommateGender,
    rommateCriteria
  });

  sendSuccess(res, HttpStatus.CREATED, demand, 'Student demand submitted successfully');
};
