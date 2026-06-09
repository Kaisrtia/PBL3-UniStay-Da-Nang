import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as reportService from '../service/report.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';
import { report_status } from '@prisma/client';
import { parsePagination } from '../../../core/utils/pagination';

export const handleGetReports = async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query, 10, 100);
  const status = req.query.status as report_status | undefined;

  if (status && !Object.values(report_status).includes(status)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid report status');
  }

  const reports = await reportService.getReports(page, limit, status);
  sendSuccess(res, HttpStatus.OK, reports);
};

export const handleTackleReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const reportId = id?.trim();

  if (!reportId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Report ID is required');
  }

  if (!status) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'status is required');
  }

  const tackledReport = await reportService.tackleReport(req.user!.id, reportId, {
    status,
    adminNote: adminNote === undefined || adminNote === null
      ? undefined
      : String(adminNote)
  });

  sendSuccess(res, HttpStatus.OK, tackledReport, 'Report tackled successfully');
};

export const handleCreateReport = async (req: Request, res: Response) => {
  const { reason, postId, commentId } = req.body;

  if (typeof reason !== 'string') {
    throw new AppError(HttpStatus.BAD_REQUEST, 'reason is required');
  }

  if (
    (postId !== undefined && typeof postId !== 'string') ||
    (commentId !== undefined && typeof commentId !== 'string')
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'postId and commentId must be strings'
    );
  }

  const report = await reportService.createReport(req.user!.id, {
    reason,
    postId: postId?.trim(),
    commentId: commentId?.trim()
  });

  sendSuccess(res, HttpStatus.CREATED, report, 'Report submitted successfully');
};
