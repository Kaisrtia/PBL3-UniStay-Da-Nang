import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, report_status, post_status, comment_status } from '@prisma/client';

export const tackleReport = async (
  adminUser: user,
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

  const updatedReport = await prismaClient.report.update({
    where: { id: reportId },
    data: {
      status: data.status,
      adminNote: data.adminNote,
      adminId: adminUser.id,
      tackledAt: new Date()
    }
  });

  if (data.status === report_status.RESOLVED) {
    if (existingReport.postId) {
      await prismaClient.post.update({
        where: { id: existingReport.postId },
        data: { status: post_status.HIDDEN }
      });
    }

    if (existingReport.commentId) {
      await prismaClient.comment.update({
        where: { id: existingReport.commentId },
        data: { status: comment_status.HIDDEN }
      });
    }
  }

  return updatedReport;
};

export const createReport = async (
  currentUser: user,
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

  if (data.postId) {
    const post = await prismaClient.post.findUnique({ where: { id: data.postId } });
    if (!post) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
    }
  }

  if (data.commentId) {
    const comment = await prismaClient.comment.findUnique({ where: { id: data.commentId } });
    if (!comment) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
    }
  }

  return prismaClient.report.create({
    data: {
      userId: currentUser.id,
      reason: data.reason,
      postId: data.postId,
      commentId: data.commentId
    }
  });
};
