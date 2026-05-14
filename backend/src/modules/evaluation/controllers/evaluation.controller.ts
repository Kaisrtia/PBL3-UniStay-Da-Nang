import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as evaluationService from '../service/evaluation.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

// -- Evaluation --

export const handleCreateSystemFeedback = async (
  req: Request,
  res: Response
) => {
  const { numberStar, description } = req.body;

  if (!numberStar || !description) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'numberStar and description are required'
    );
  }

  const feedback = await evaluationService.createSystemFeedback(req.user!.id, {
    numberStar: Number(numberStar),
    description
  });

  sendSuccess(
    res,
    HttpStatus.CREATED,
    feedback,
    'System feedback submitted successfully'
  );
};
