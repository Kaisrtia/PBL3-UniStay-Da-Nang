import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, comment_status, post_status } from '@prisma/client';
import { generateHybridId } from '../../../core/utils/generateId';
import { addCommentNotificationJob } from '../../notification/queues/notification.queue';
import * as blockService from '../../user/service/block.service';

export const createComment = async (
  currentUser: user,
  data: {
    postId: string;
    content: string;
    parentId?: string;
  }
) => {
  const content = data.content.trim();

  if (!content) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'content is required');
  }

  const newComment = await prismaClient.$transaction(async (tx) => {
    const post = await tx.post.findUnique({ where: { id: data.postId } });
    if (!post) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
    }

    if (post.status !== post_status.APPROVED && post.userId !== currentUser.id) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Cannot comment on a post that is not approved'
      );
    }

    if (
      post.userId !== currentUser.id &&
      (await blockService.areUsersBlocked(currentUser.id, post.userId))
    ) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        'You cannot comment because one of you has blocked the other user'
      );
    }

    if (data.parentId) {
      const parentComment = await tx.comment.findUnique({
        where: { id: data.parentId }
      });

      if (!parentComment) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Parent comment not found');
      }

      if (parentComment.postId !== data.postId) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          'Parent comment belongs to a different post'
        );
      }

      if (parentComment.status !== comment_status.DISPLAYED) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          'Cannot reply to a hidden comment'
        );
      }

      if (
        parentComment.userId !== currentUser.id &&
        (await blockService.areUsersBlocked(
          currentUser.id,
          parentComment.userId
        ))
      ) {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          'You cannot reply because one of you has blocked the other user'
        );
      }
    }

    return tx.comment.create({
      data: {
        id: generateHybridId('cmt_'),
        userId: currentUser.id,
        postId: data.postId,
        content,
        parentId: data.parentId || null
      }
    });
  });

  addCommentNotificationJob(newComment.id).catch((err) => {
    console.error('Error enqueueing comment notification job:', err);
  });

  return newComment;
};

export const updateComment = async (
  currentUser: user,
  commentId: string,
  content: string
) => {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'content is required');
  }

  const comment = await prismaClient.$transaction(async (tx) => {
    const existingComment = await tx.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
    }

    if (existingComment.userId !== currentUser.id) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        'You do not have permission to update this comment'
      );
    }

    const result = await tx.comment.updateMany({
      where: {
        id: commentId,
        userId: currentUser.id,
        status: comment_status.DISPLAYED
      },
      data: {
        content: normalizedContent,
        updatedAt: new Date()
      }
    });

    if (result.count === 0) {
      return null;
    }

    return tx.comment.findFirst({
      where: { id: commentId, userId: currentUser.id }
    });
  });

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
  }

  return comment;
};

export const hideComment = async (currentUser: user, commentId: string) => {
  const comment = await prismaClient.$transaction(async (tx) => {
    const existingComment = await tx.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
    }

    if (existingComment.userId !== currentUser.id) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        'You do not have permission to hide this comment'
      );
    }

    const result = await tx.comment.updateMany({
      where: {
        id: commentId,
        userId: currentUser.id,
        status: comment_status.DISPLAYED
      },
      data: {
        status: comment_status.HIDDEN,
        updatedAt: new Date()
      }
    });

    if (result.count === 0) {
      return null;
    }

    return tx.comment.findFirst({
      where: { id: commentId, userId: currentUser.id }
    });
  });

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
  }

  return comment;
};
