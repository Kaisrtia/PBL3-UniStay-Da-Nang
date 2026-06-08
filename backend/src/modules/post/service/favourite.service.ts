import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { Prisma, user } from '@prisma/client';
import { requirePost } from '../utils/post.helper';

export const getFavouritePosts = async (
  currentUser: user,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where = { studentId: currentUser.id };

  const [favourites, totalCount] = await Promise.all([
    prismaClient.student_favorite_post.findMany({
      where,
      skip,
      take: limit,
      include: {
        post: {
          include: {
            postImages: true,
            postAmenities: {
              include: { amenity: true }
            },
            ward: true,
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                hosts: {
                  select: { isVerified: true }
                }
              }
            },
            _count: {
              select: { comments: true }
            }
          }
        }
      }
    }),
    prismaClient.student_favorite_post.count({ where })
  ]);

  return {
    data: favourites.map((favourite) => favourite.post),
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const addFavouritePost = async (currentUser: user, postId: string) => {
  await requirePost(postId);

  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (existing) {
    throw new AppError(
      HttpStatus.CONFLICT,
      'Bài đăng đã có trong danh sách yêu thích.'
    );
  }

  try {
    return await prismaClient.student_favorite_post.create({
      data: { studentId: currentUser.id, postId }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        HttpStatus.CONFLICT,
        'Bài đăng đã có trong danh sách yêu thích.'
      );
    }
    throw error;
  }
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
      'Bài đăng không có trong danh sách yêu thích.'
    );
  }

  try {
    await prismaClient.student_favorite_post.delete({
      where: { studentId_postId: { studentId: currentUser.id, postId } }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Bài đăng không có trong danh sách yêu thích.'
      );
    }
    throw error;
  }
};
