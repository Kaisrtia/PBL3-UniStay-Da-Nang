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

  if (numberStar === undefined || description === undefined) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'numberStar and description are required'
    );
  }

  const parsedNumberStar = Number(numberStar);

  if (!Number.isInteger(parsedNumberStar)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Star rating must be an integer between 1 and 5'
    );
  }

  const feedback = await evaluationService.createSystemFeedback(req.user!.id, {
    numberStar: parsedNumberStar,
    description: String(description)
  });

  sendSuccess(
    res,
    HttpStatus.CREATED,
    feedback,
    'System feedback submitted successfully'
  );
};
