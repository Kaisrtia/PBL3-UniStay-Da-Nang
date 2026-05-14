import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { report_status, post_status, comment_status } from '@prisma/client';

export const tackleReport = async (
  adminId: string,
  reportId: string,
  data: {
    status: report_status;
    adminNote?: string;
  }
) => {
  if (data.status !== report_status.RESOLVED && data.status !== report_status.REJECTED) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Invalid tackle status. Can only tackle as RESOLVED or REJECTED.'
    );
  }

  const existingReport = await prismaClient.report.findUnique({
    where: { id: reportId }
  });

  if (!existingReport) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Report not found');
  }

  if (existingReport.status !== report_status.PENDING) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Report has already been tackled');
  }

  return prismaClient.$transaction(async (tx) => {
    const updatedReport = await tx.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        adminNote: data.adminNote,
        adminId,
        tackledAt: new Date()
      }
    });

    if (data.status === report_status.RESOLVED) {
      if (existingReport.postId) {
        await tx.post.update({
          where: { id: existingReport.postId },
          data: { status: post_status.HIDDEN }
        });
      }

      if (existingReport.commentId) {
        await tx.comment.update({
          where: { id: existingReport.commentId },
          data: { status: comment_status.HIDDEN }
        });
      }
    }

    return updatedReport;
  });
};

export const createReport = async (
  userId: string,
  data: {
    reason: string;
    postId?: string;
    commentId?: string;
  }
) => {
  if (!data.postId && !data.commentId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Must provide either a postId or a commentId');
  }

  if (data.postId && data.commentId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot report both a post and a comment at the same time');
  }

  let reportedUserId: string | undefined;

  if (data.postId) {
    const post = await prismaClient.post.findUnique({ where: { id: data.postId } });
    if (!post) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
    }
    reportedUserId = post.userId;
  }

  if (data.commentId) {
    const comment = await prismaClient.comment.findUnique({ where: { id: data.commentId } });
    if (!comment) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
    }
    reportedUserId = comment.userId;
  }

  if (!reportedUserId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Reported user could not be determined');
  }

  return prismaClient.report.create({
    data: {
      userId,
      reportedUserId,
      reason: data.reason,
      postId: data.postId,
      commentId: data.commentId
    }
  });
};
