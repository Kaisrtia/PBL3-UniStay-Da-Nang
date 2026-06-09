import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const requirePost = async (postId: string) => {
  const post = await prismaClient.post.findFirst({
    where: {
      id: postId,
      status: 'APPROVED'
    }
  });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }
  return post;
};
