import prismaClient from '../../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../../core/exceptions/AppError';
import {
  user,
  room_type,
  post_purpose,
  amenity_condition,
  post_status
} from '@prisma/client';
import { generateHybridId } from '../../../../core/utils/generateId';
import { addModerationFlow } from '../../queues/moderation.queue';
import { addCensorPostNotificationJob } from '../../../notification/queues/notification.queue';
import { addMatchDemandJob } from '../../queues/matchDemand.queue';

export const censorPost = async (
  admin: user,
  postId: string,
  status: post_status,
  rejectionReason?: string
) => {
  if (!status) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Status is required');
  }

  if (status !== post_status.APPROVED && status !== post_status.REJECTED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid status');
  }

  if (status === post_status.REJECTED && !rejectionReason) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Reject reason is required');
  }

  const post = await prismaClient.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  const updatedPost = await prismaClient.post.update({
    where: { id: postId },
    data: {
      status,
      rejectionReason: status === post_status.REJECTED ? rejectionReason : null,
      moderator: {
        connect: { id: admin.id }
      }
    }
  });
  await addCensorPostNotificationJob('manual_censoring', {
    postId: post.id,
    userId: post.userId,
    status,
    rejectionReason
  });
  if (status === post_status.APPROVED) {
    await addMatchDemandJob('match_approved_post_admin', { postId: post.id });
  }
  return updatedPost;
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
  const ward = await prismaClient.ward.findUnique({
    where: { id: data.wardId }
  });
  if (!ward) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Ward not found');
  }

  // Create post with nested images and amenities
  const post = await prismaClient.post.create({
    data: {
      id: generateHybridId('pst_'),
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

      ...(data.postImages &&
        data.postImages.length > 0 && {
          postImages: {
            create: data.postImages.map((imageUrl) => ({
              imageUrl
            }))
          }
        }),

      ...(data.postAmenities &&
        data.postAmenities.length > 0 && {
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
  // Enqueue moderation job to check for invalid image or description
  await addModerationFlow(post.id);
  return post;
};

export const updatePost = async (
  currentUser: user,
  postId: string,
  data: {
    title?: string;
    wardId?: number;
    purpose?: string;
    detailAddress?: string;
    area?: number;
    price?: number;
    deposit?: number;
    roomType?: room_type;
    postPurpose?: post_purpose;
    description?: string;
    latitude?: number;
    longitude?: number;
    postImages?: string[];
    postAmenities?: {
      amenityId: number;
      currentCondition?: amenity_condition;
    }[];
  }
) => {
  const post = await prismaClient.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  if (post.userId !== currentUser.id) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      'You can only update your own posts'
    );
  }

  if (data.wardId) {
    const ward = await prismaClient.ward.findUnique({
      where: { id: data.wardId }
    });
    if (!ward) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Ward not found');
    }
  }

  if (
    new Date().getTime() - post.createdAt.getTime() >
    7 * 24 * 60 * 60 * 1000
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Post cannot be updated after 7 days'
    );
  }

  return prismaClient.$transaction(async (tx) => {
    // Basic update
    await tx.post.update({
      where: { id: postId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.wardId && { wardId: data.wardId }),
        ...(data.purpose && { purpose: data.purpose }),
        ...(data.detailAddress && { detailAddress: data.detailAddress }),
        ...(data.area && { area: data.area }),
        ...(data.price && { price: data.price }),
        ...(data.deposit && { deposit: data.deposit }),
        ...(data.roomType && { roomType: data.roomType }),
        ...(data.postPurpose && { postPurpose: data.postPurpose }),
        ...(data.description && { description: data.description }),
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.longitude && { longitude: data.longitude }),
        status: 'UPDATED',
        updatedAt: new Date()
      }
    });

    // Handle images: replace all
    if (data.postImages) {
      await tx.post_image.deleteMany({ where: { postId } });
      if (data.postImages.length > 0) {
        await tx.post_image.createMany({
          data: data.postImages.map((imageUrl) => ({
            postId,
            imageUrl
          }))
        });
      }
    }

    // Handle amenities: replace all
    if (data.postAmenities) {
      await tx.post_amenity.deleteMany({ where: { postId } });
      if (data.postAmenities.length > 0) {
        await tx.post_amenity.createMany({
          data: data.postAmenities.map((amenity) => ({
            postId,
            amenityId: amenity.amenityId,
            currentCondition: amenity.currentCondition
          }))
        });
      }
    }

    return tx.post.findUnique({
      where: { id: postId },
      include: {
        postImages: true,
        postAmenities: true
      }
    });
  });
};
