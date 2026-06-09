import prismaClient from '../../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../../core/exceptions/AppError';
import {
  user,
  room_type,
  post_purpose,
  amenity_condition,
  post_status,
  Prisma
} from '@prisma/client';
import { generateHybridId } from '../../../../core/utils/generateId';
import { addModerationFlow } from '../../queues/moderation.queue';
import { addCensorPostNotificationJob } from '../../../notification/queues/notification.queue';
import { addMatchDemandJob } from '../../queues/matchDemand.queue';
import { addPostCacheRefreshJob } from '../../queues/cache.queue';
import { createPostCensorNotification } from '../../../notification/services/notification.service';

type PostAmenityInput = {
  amenityId: number;
  currentCondition?: amenity_condition;
};

const queuePostCacheRefresh = () => {
  addPostCacheRefreshJob().catch((error) => {
    console.error('Error enqueueing approved post cache refresh job:', error);
  });
};

const validatePostAmenities = async (
  postAmenities: PostAmenityInput[] | undefined,
  client: Prisma.TransactionClient | typeof prismaClient
) => {
  if (!postAmenities || postAmenities.length === 0) return;

  const amenityIds = postAmenities.map(({ amenityId }) => amenityId);

  if (new Set(amenityIds).size !== amenityIds.length) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Post amenities must not contain duplicate amenity IDs'
    );
  }

  const existingAmenities = await client.amenity.count({
    where: {
      id: {
        in: amenityIds
      }
    }
  });

  if (existingAmenities !== amenityIds.length) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid amenity IDs');
  }
};

const applyRolePostRules = <T extends {
  purpose?: string;
  postPurpose?: post_purpose;
  roomType?: room_type;
}>(currentUser: user, data: T): T => {
  if (currentUser.role === 'HOST') {
    return {
      ...data,
      purpose: post_purpose.RENT,
      postPurpose: post_purpose.RENT,
      roomType: room_type.ROOM
    };
  }

  if (currentUser.role === 'STUDENT') {
    return {
      ...data,
      purpose: post_purpose.FIND_ROOMMATE,
      postPurpose: post_purpose.FIND_ROOMMATE
    };
  }

  return data;
};

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
  queuePostCacheRefresh();

  const notification = await createPostCensorNotification(
    post.userId,
    post.id,
    status,
    rejectionReason
  );

  addCensorPostNotificationJob('automated_censoring', {
    notificationId: notification.id
  }).catch(err => {
    console.error('Error enqueueing post censor notification job:', err);
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
    exactAddress?: string;
    district?: string;
    city?: string;
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
  const normalizedData = applyRolePostRules(currentUser, data);
  // Validate ward exists
  const ward = await prismaClient.ward.findUnique({
    where: { id: normalizedData.wardId }
  });
  if (!ward) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Ward not found');
  }
  await validatePostAmenities(normalizedData.postAmenities, prismaClient);

  // Create post with nested images and amenities
  const post = await prismaClient.post.create({
    data: {
      id: generateHybridId('pst_'),
      userId: currentUser.id,
      title: normalizedData.title,
      wardId: normalizedData.wardId,
      purpose: normalizedData.purpose,
      detailAddress: normalizedData.detailAddress,
      exactAddress: normalizedData.exactAddress,
      district: normalizedData.district,
      city: normalizedData.city,
      area: normalizedData.area,
      price: normalizedData.price,
      deposit: normalizedData.deposit,
      roomType: normalizedData.roomType,
      postPurpose: normalizedData.postPurpose,
      description: normalizedData.description,
      latitude: normalizedData.latitude,
      longitude: normalizedData.longitude,
      // Default status is PENDING, we wait for AI moderation.

      ...(normalizedData.postImages &&
        normalizedData.postImages.length > 0 && {
          postImages: {
            create: normalizedData.postImages.map((imageUrl) => ({
              imageUrl
            }))
          }
        }),

      ...(normalizedData.postAmenities &&
        normalizedData.postAmenities.length > 0 && {
          postAmenities: {
            create: normalizedData.postAmenities.map((amenity) => ({
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
  try {
    await addModerationFlow(post.id);
  } catch {
    await prismaClient.post.update({
      where: { id: post.id },
      data: {
        rejectionReason:
          'Post was created, but automatic moderation could not be queued. Please review manually.'
      }
    });
  }
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
    exactAddress?: string;
    district?: string;
    city?: string;
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
  const normalizedData = applyRolePostRules(currentUser, data);
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

  if (normalizedData.wardId) {
    const ward = await prismaClient.ward.findUnique({
      where: { id: normalizedData.wardId }
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

  const updatedPost = await prismaClient.$transaction(async (tx) => {
    await validatePostAmenities(normalizedData.postAmenities, tx);

    // Basic update
    await tx.post.update({
      where: { id: postId },
      data: {
        ...(normalizedData.title && { title: normalizedData.title }),
        ...(normalizedData.wardId && { wardId: normalizedData.wardId }),
        ...(normalizedData.purpose && { purpose: normalizedData.purpose }),
        ...(normalizedData.detailAddress && { detailAddress: normalizedData.detailAddress }),
        ...(normalizedData.exactAddress && { exactAddress: normalizedData.exactAddress }),
        ...(normalizedData.district && { district: normalizedData.district }),
        ...(normalizedData.city && { city: normalizedData.city }),
        ...(normalizedData.area && { area: normalizedData.area }),
        ...(normalizedData.price && { price: normalizedData.price }),
        ...(normalizedData.deposit && { deposit: normalizedData.deposit }),
        ...(normalizedData.roomType && { roomType: normalizedData.roomType }),
        ...(normalizedData.postPurpose && { postPurpose: normalizedData.postPurpose }),
        ...(normalizedData.description && { description: normalizedData.description }),
        ...(normalizedData.latitude && { latitude: normalizedData.latitude }),
        ...(normalizedData.longitude && { longitude: normalizedData.longitude }),
        status: 'UPDATED',
        updatedAt: new Date()
      }
    });

    // Handle images: replace all
    if (normalizedData.postImages) {
      await tx.post_image.deleteMany({ where: { postId } });
      if (normalizedData.postImages.length > 0) {
        await tx.post_image.createMany({
          data: normalizedData.postImages.map((imageUrl) => ({
            postId,
            imageUrl
          }))
        });
      }
    }

    // Handle amenities: replace all
    if (normalizedData.postAmenities) {
      await tx.post_amenity.deleteMany({ where: { postId } });
      if (normalizedData.postAmenities.length > 0) {
        await tx.post_amenity.createMany({
          data: normalizedData.postAmenities.map((amenity) => ({
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

  queuePostCacheRefresh();
  return updatedPost;
};
