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
