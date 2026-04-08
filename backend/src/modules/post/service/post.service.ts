import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, room_type, post_purpose, amenity_condition } from '@prisma/client';
import { generateHybridId } from '../../../core/utils/generateId';

export const getPostDetail = async (postId: string) => {
  const post = await prismaClient.post.findUnique({
    where: { id: postId },
    include: {
      postImages: true,
      postAmenities: true
    }
  });

  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  return post;
};

export const createPost = async (
  currentUser: user,
  data: {
    title: string;
    wardId: number;
    purpose: string;
    detailAddress: string;
    area: number;
    price: number;
    deposit: number;
    roomType: room_type;
    postPurpose: post_purpose;
    description: string;
    latitude: number;
    longitude: number;
    postImages?: string[];
    postAmenities?: {
      amenityId: number;
      currentCondition?: amenity_condition;
    }[];
  }
) => {
  // Validate ward exists
  const ward = await prismaClient.ward.findUnique({ where: { id: data.wardId } });
  if (!ward) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Ward not found');
  }

  // Create post with nested images and amenities
  return prismaClient.post.create({
    data: {
      id: generateHybridId('POST_'),
      userId: currentUser.id,
      title: data.title,
      wardId: data.wardId,
      purpose: data.purpose,
      detailAddress: data.detailAddress,
      area: data.area,
      price: data.price,
      deposit: data.deposit,
      roomType: data.roomType,
      postPurpose: data.postPurpose,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      // Default status is PENDING, we wait for AI moderation.
      
      ...(data.postImages && data.postImages.length > 0 && {
        postImages: {
          create: data.postImages.map((imageUrl) => ({
            imageUrl
          }))
        }
      }),

      ...(data.postAmenities && data.postAmenities.length > 0 && {
        postAmenities: {
          create: data.postAmenities.map((amenity) => ({
            amenityId: amenity.amenityId,
            currentCondition: amenity.currentCondition
          }))
        }
      })
    },
    include: {
      postImages: true,
      postAmenities: true
    }
  });
};


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
