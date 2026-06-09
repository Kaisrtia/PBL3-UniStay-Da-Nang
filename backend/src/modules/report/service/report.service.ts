import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import {
  Prisma,
  report_status,
  post_status,
  comment_status
} from '@prisma/client';
import { addPostCacheRefreshJob } from '../../post/queues/cache.queue';

export const getReports = async (
  page: number = 1,
  limit: number = 10,
  status?: report_status
) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;
  const where = status ? { status } : {};

  const [data, total] = await Promise.all([
    prismaClient.report.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            status: true
          }
        },
        admin: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        comment: {
          select: {
            id: true,
            postId: true,
            content: true,
            status: true
          }
        }
      }
    }),
    prismaClient.report.count({ where })
  ]);

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};

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

  const adminNote = data.adminNote?.trim() || null;

  let hiddenPost = false;
  const report = await prismaClient.$transaction(async (tx) => {
    const existingReport = await tx.report.findUnique({
      where: { id: reportId }
    });

    if (!existingReport) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Report not found');
    }

    const claimedReport = await tx.report.updateMany({
      where: {
        id: reportId,
        status: report_status.PENDING
      },
      data: {
        status: data.status,
        adminNote,
        adminId,
        tackledAt: new Date()
      }
    });

    if (claimedReport.count === 0) {
      throw new AppError(HttpStatus.CONFLICT, 'Report has already been tackled');
    }

    if (data.status === report_status.RESOLVED) {
      if (existingReport.postId) {
        await tx.post.updateMany({
          where: { id: existingReport.postId },
          data: { status: post_status.HIDDEN }
        });
        hiddenPost = true;
      }

      if (existingReport.commentId) {
        await tx.comment.updateMany({
          where: { id: existingReport.commentId },
          data: { status: comment_status.HIDDEN }
        });
      }
    }

    return tx.report.findUnique({
      where: { id: reportId }
    });
  });

  if (hiddenPost) {
    addPostCacheRefreshJob().catch((error) => {
      console.error('Error enqueueing approved post cache refresh job:', error);
    });
  }

  return report;
};

export const createReport = async (
  userId: string,
  data: {
    reason: string;
    postId?: string;
    commentId?: string;
  }
) => {
  const reason = data.reason.trim();

  if (!reason) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'reason is required');
  }

  if (!data.postId && !data.commentId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Must provide either a postId or a commentId');
  }

  if (data.postId && data.commentId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot report both a post and a comment at the same time');
  }

  try {
    return await prismaClient.$transaction(async (tx) => {
      let reportedUserId: string;

      if (data.postId) {
        const post = await tx.post.findUnique({ where: { id: data.postId } });
        if (!post) {
          throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
        }
        if (post.status === post_status.HIDDEN) {
          throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot report a hidden post');
        }
        reportedUserId = post.userId;
      } else {
        const comment = await tx.comment.findUnique({
          where: { id: data.commentId! }
        });
        if (!comment) {
          throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
        }
        if (comment.status === comment_status.HIDDEN) {
          throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot report a hidden comment');
        }
        reportedUserId = comment.userId;
      }

      if (reportedUserId === userId) {
        throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot report your own content');
      }

      const existingPendingReport = await tx.report.findFirst({
        where: {
          userId,
          status: report_status.PENDING,
          ...(data.postId
            ? { postId: data.postId }
            : { commentId: data.commentId })
        },
        select: { id: true }
      });

      if (existingPendingReport) {
        throw new AppError(
          HttpStatus.CONFLICT,
          'You already have a pending report for this content'
        );
      }

      return tx.report.create({
        data: {
          userId,
          reportedUserId,
          reason,
          postId: data.postId,
          commentId: data.commentId
        }
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        HttpStatus.CONFLICT,
        'You already have a pending report for this content'
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Reported content no longer exists');
    }
    throw error;
  }
};
