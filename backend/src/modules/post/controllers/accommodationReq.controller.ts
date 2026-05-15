import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as accommodationReqService from '../service/accommodationReq.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleCreateAccommodationRequest = async (
  req: Request,
  res: Response
) => {
  const { postId } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const request = await accommodationReqService.createAccommodationRequest(
    req.user!,
    postId
  );

  sendSuccess(
    res,
    HttpStatus.CREATED,
    request,
    'Accommodation request submitted successfully'
  );
};

export const handleGetReceivedAccommodationRequests = async (
  req: Request,
  res: Response
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;

  const requests = await accommodationReqService.getReceivedAccommodationRequests(
    req.user!,
    page,
    limit
  );

  sendSuccess(res, HttpStatus.OK, requests, 'Đã tải danh sách sinh viên đã liên hệ.');
};

export const handleGetSentAccommodationRequests = async (
  req: Request,
  res: Response
) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;

  const requests = await accommodationReqService.getSentAccommodationRequests(
    req.user!,
    page,
    limit
  );

  sendSuccess(res, HttpStatus.OK, requests, 'Đã tải danh sách bài đăng bạn đã liên hệ.');
};
