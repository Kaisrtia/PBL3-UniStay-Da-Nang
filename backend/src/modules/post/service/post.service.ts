import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user } from '@prisma/client';

const requirePost = async (postId: string) => {
  const post = await prismaClient.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }
  return post;
};

export const addFavouritePost = async (currentUser: user, postId: string) => {
  await requirePost(postId);

  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (existing) {
    throw new AppError(HttpStatus.CONFLICT, 'Post is already in your favourites');
  }

  return prismaClient.student_favorite_post.create({
    data: { studentId: currentUser.id, postId }
  });
};

export const removeFavouritePost = async (currentUser: user, postId: string) => {
  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (!existing) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found in your favourites');
  }

  await prismaClient.student_favorite_post.delete({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });
};

// ─── Accommodation Request ────────────────────────────────────────────────────

export const createAccommodationRequest = async (currentUser: user, postId: string) => {
  const post = await requirePost(postId);

  if (post.userId === currentUser.id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot request your own post');
  }

  const existing = await prismaClient.accomodation_request.findUnique({
    where: { postId_userId: { postId, userId: currentUser.id } }
  });

  if (existing) {
    throw new AppError(HttpStatus.CONFLICT, 'You have already submitted a request for this post');
  }

  return prismaClient.accomodation_request.create({
    data: { postId, userId: currentUser.id }
  });
};
