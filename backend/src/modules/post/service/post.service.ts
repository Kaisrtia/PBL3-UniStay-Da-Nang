import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, room_type, post_purpose, amenity_condition, Prisma } from '@prisma/client';
import { generateHybridId } from '../../../core/utils/generateId';

export interface PostFilters {
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
