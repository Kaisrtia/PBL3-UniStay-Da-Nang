import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, room_type, post_purpose, amenity_condition, Prisma, post_status } from '@prisma/client';
import { generateHybridId } from '../../../core/utils/generateId';

export interface PostFilters {
  purpose?: post_purpose;
  status?: post_status; // Used for admin-level filtering
  wardId?: number;
  districtId?: number;
  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
  roomType?: room_type;
  verifiedHost?: boolean;
  amenities?: number[];   // list of amenityIds — match posts containing ANY of these
  hasMedia?: boolean;     // true = must have at least one image
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price' | 'area' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export const getPosts = async (filters: PostFilters) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy ?? 'createdAt';
  const sortOrder = filters.sortOrder ?? 'desc';

  // Build dynamic where clause — every filter is optional and cumulative (AND)
  const where: Prisma.postWhereInput = {
    status: 'APPROVED'
  };

  // Purpose
  if (filters.purpose) {
    where.purpose = filters.purpose;
  }

  // Location — filter by specific ward or by district (all wards within it)
  if (filters.wardId !== undefined) {
    where.wardId = filters.wardId;
  } else if (filters.districtId !== undefined) {
    where.ward = { districtId: filters.districtId };
  }

  // Area range
  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.area = {};
    if (filters.minArea !== undefined) (where.area as Prisma.DecimalFilter).gte = filters.minArea;
    if (filters.maxArea !== undefined) (where.area as Prisma.DecimalFilter).lte = filters.maxArea;
  }

  // Price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) (where.price as Prisma.DecimalFilter).gte = filters.minPrice;
    if (filters.maxPrice !== undefined) (where.price as Prisma.DecimalFilter).lte = filters.maxPrice;
  }

  // Room type
  if (filters.roomType) {
    where.roomType = filters.roomType;
  }

  // Verified host — traverse post → user → hosts[] → isVerified
  if (filters.verifiedHost === true) {
    where.user = {
      hosts: {
        some: { isVerified: true }
      }
    };
  }

  // Amenities — posts must have at least one of the specified amenity IDs
  if (filters.amenities && filters.amenities.length > 0) {
    where.postAmenities = {
      some: {
        amenityId: { in: filters.amenities }
      }
    };
  }

  // Has media (images)
  if (filters.hasMedia === true) {
    where.postImages = { some: {} };
  }

  const [posts, totalCount] = await Promise.all([
    prismaClient.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        postImages: true,
        postAmenities: {
          include: { amenity: true }
        },
        ward: {
          include: { district: true }
        },
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
    }),
    prismaClient.post.count({ where })
  ]);

  return {
    data: posts,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const getPostsForAdmin = async (status?: post_status, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const where: Prisma.postWhereInput = {};
  if (status) {
    where.status = status;
  }

  const [posts, totalCount] = await Promise.all([
    prismaClient.post.findMany({
      where,
      skip,
      take: limit,
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
        ward: {
          include: { district: true }
        },
        _count: {
          select: { comments: true, reports: true }
        }
      }
    }),
    prismaClient.post.count({ where })
  ]);

  return {
    data: posts,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const censorPost = async (admin: user, postId: string, status: post_status, rejectionReason?: string) => {
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
      rejectionReason: status === post_status.REJECTED ? rejectionReason : null
    }
  });

  return updatedPost;
}

export const getPostStatistics = async (period: 'day' | 'week' | 'month' = 'day') => {
  const now = new Date();
  let startDate = new Date();

  if (period === 'day') {
    startDate.setDate(now.getDate() - 1);
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  }

  const where: Prisma.postWhereInput = {
    createdAt: {
      gte: startDate
    }
  };

  const [totalPosts, postsByStatus, postsByRoomType, postsByPurpose] = await Promise.all([
    prismaClient.post.count({ where }),
    prismaClient.post.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    }),
    prismaClient.post.groupBy({
      by: ['roomType'],
      where,
      _count: {
        id: true
      }
    }),
    prismaClient.post.groupBy({
      by: ['postPurpose'],
      where,
      _count: {
        id: true
      }
    })
  ]);

  return {
    totalPosts,
    byStatus: postsByStatus.map(item => ({ status: item.status, count: item._count.id })),
    byRoomType: postsByRoomType.map(item => ({ roomType: item.roomType, count: item._count.id })),
    byPurpose: postsByPurpose.map(item => ({ purpose: item.postPurpose, count: item._count.id })),
    period,
    since: startDate
  };
};

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

export const getMyPosts = async (currentUser: user, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [posts, totalCount] = await Promise.all([
    prismaClient.post.findMany({
      where: { userId: currentUser.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        postImages: true,
        postAmenities: {
          include: { amenity: true }
        },
        ward: {
          include: { district: true }
        },
        _count: {
          select: { comments: true, accomodationRequests: true }
        }
      }
    }),
    prismaClient.post.count({ where: { userId: currentUser.id } })
  ]);

  return {
    data: posts,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
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
    throw new AppError(HttpStatus.FORBIDDEN, 'You can only update your own posts');
  }

  if (data.wardId) {
    const ward = await prismaClient.ward.findUnique({ where: { id: data.wardId } });
    if (!ward) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Ward not found');
    }
  }

  if (new Date().getTime() - post.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Post cannot be updated after 7 days');
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
