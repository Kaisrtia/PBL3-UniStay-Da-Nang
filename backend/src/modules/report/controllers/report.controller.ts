import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as reportService from '../service/report.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleTackleReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  if (!id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Report ID is required');
  }

  if (!status) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'status is required');
  }

  const tackledReport = await reportService.tackleReport(req.user!, id, {
    status,
    adminNote
  });

  sendSuccess(res, HttpStatus.OK, tackledReport, 'Report tackled successfully');
};

export const handleCreateReport = async (req: Request, res: Response) => {
  const { reason, postId, commentId } = req.body;

  if (!reason) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'reason is required');
  }

  const report = await reportService.createReport(req.user!, {
    reason,
    postId,
    commentId
  });

  sendSuccess(res, HttpStatus.CREATED, report, 'Report submitted successfully');
};
