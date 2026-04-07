import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, comment_status } from '@prisma/client';
import { generateHybridId } from '../../../core/utils/generateId';

export const createComment = async (
  currentUser: user,
  data: {
    postId: string;
    content: string;
    parentId?: string;
  }
) => {
  // Validate Post
  const post = await prismaClient.post.findUnique({ where: { id: data.postId } });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  // Validate parent comment if provided
  if (data.parentId) {
    const parentComment = await prismaClient.comment.findUnique({
      where: { id: data.parentId }
    });

    if (!parentComment) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Parent comment not found');
    }

    if (parentComment.postId !== data.postId) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Parent comment belongs to a different post');
    }
  }

  return prismaClient.comment.create({
    data: {
      id: generateHybridId('cmt_'),
      userId: currentUser.id,
      postId: data.postId,
      content: data.content,
      parentId: data.parentId || null
    }
  });
};

export const updateComment = async (
  currentUser: user,
  commentId: string,
  content: string
) => {
  const comment = await prismaClient.comment.findUnique({ where: { id: commentId } });

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
  }

  if (comment.userId !== currentUser.id) {
    throw new AppError(HttpStatus.FORBIDDEN, 'You do not have permission to update this comment');
  }

  return prismaClient.comment.update({
    where: { id: commentId },
    data: {
      content,
      updatedAt: new Date()
    }
  });
};

export const hideComment = async (
  currentUser: user,
  commentId: string
) => {
  const comment = await prismaClient.comment.findUnique({ where: { id: commentId } });

  if (!comment) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Comment not found');
  }

  if (comment.userId !== currentUser.id) {
    throw new AppError(HttpStatus.FORBIDDEN, 'You do not have permission to hide this comment');
  }

  return prismaClient.comment.update({
    where: { id: commentId },
    data: {
      status: comment_status.HIDDEN,
      updatedAt: new Date()
    }
  });
};
