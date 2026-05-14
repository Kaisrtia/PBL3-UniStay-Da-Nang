import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user } from '@prisma/client';
import { requirePost } from '../utils/post.helper';

export const addFavouritePost = async (currentUser: user, postId: string) => {
  await requirePost(postId);

  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (existing) {
    throw new AppError(
      HttpStatus.CONFLICT,
      'Post is already in your favourites'
    );
  }

  return prismaClient.student_favorite_post.create({
    data: { studentId: currentUser.id, postId }
  });
};

export const removeFavouritePost = async (
  currentUser: user,
  postId: string
) => {
  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (!existing) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'Post not found in your favourites'
    );
  }

  await prismaClient.student_favorite_post.delete({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });
};
