import prismaClient from '../../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../../core/exceptions/AppError';
import { calculateScore } from '../../../demand/utils/matching.handler';
import { connection } from '../../../../core/config/redis.connection';
import {
  user,
  room_type,
  post_purpose,
  Prisma,
  post_status,
  comment_status
} from '@prisma/client';

export interface PostFilters {
  purpose?: post_purpose;
  status?: post_status; // Used for admin-level filtering
  wardId?: number;

  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
  roomType?: room_type;
  verifiedHost?: boolean;
  amenities?: number[]; // list of amenityIds — match posts containing ANY of these
  hasMedia?: boolean; // true = must have at least one image
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
  }

  // Area range
  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.area = {};
    if (filters.minArea !== undefined)
      (where.area as Prisma.DecimalFilter).gte = filters.minArea;
    if (filters.maxArea !== undefined)
      (where.area as Prisma.DecimalFilter).lte = filters.maxArea;
  }

  // Price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined)
      (where.price as Prisma.DecimalFilter).gte = filters.minPrice;
    if (filters.maxPrice !== undefined)
      (where.price as Prisma.DecimalFilter).lte = filters.maxPrice;
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

export const getRecommendedPosts = async (
  currentUser: user,
  page: number = 1,
  limit: number = 10
) => {
  const demand = await prismaClient.student_demand.findUnique({
    where: { studentId: currentUser.id },
    include: {
      student: {
        include: {
          demandAmenities: {
            include: {
              amenity: true
            }
          }
        }
      }
    }
  });
  if (!demand) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Student demand not found');
  }

  const cachedPostsJson = await connection.get('cache:posts:approved');
  if (!cachedPostsJson) {
    return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
  }

  let cachedPosts = JSON.parse(cachedPostsJson);

  // Filter and score posts
  const scoredPosts = cachedPosts
    .map((post: any) => ({
      ...post,
      score: calculateScore(post, demand)
    }))
    .filter((post: any) => post.score > 0);

  // Sort by score descending
  scoredPosts.sort((a: any, b: any) => b.score - a.score);

  // Paginate
  const skip = (page - 1) * limit;
  const paginatedPosts = scoredPosts.slice(skip, skip + limit);

  return {
    data: paginatedPosts,
    meta: {
      total: scoredPosts.length,
      page,
      limit,
      totalPages: Math.ceil(scoredPosts.length / limit)
    }
  };
};

export const getPostsForAdmin = async (
  status?: post_status,
  page: number = 1,
  limit: number = 10
) => {
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
        ward: true,
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

export const getPostStatistics = async (
  period: 'day' | 'week' | 'month' = 'day'
) => {
  const now = new Date();
  const startDate = new Date();

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

  const [totalPosts, postsByStatus, postsByRoomType, postsByPurpose] =
    await Promise.all([
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
    byStatus: postsByStatus.map((item) => ({
      status: item.status,
      count: item._count.id
    })),
    byRoomType: postsByRoomType.map((item) => ({
      roomType: item.roomType,
      count: item._count.id
    })),
    byPurpose: postsByPurpose.map((item) => ({
      purpose: item.postPurpose,
      count: item._count.id
    })),
    period,
    since: startDate
  };
};

export const getPostsCountByWard = async () => {
  const wards = await prismaClient.ward.findMany({
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });

  const result = wards.map((ward) => {
    return {
      id: ward.id,
      'name ward': ward.name,
      'number of posts': ward._count.posts
    };
  });

  return result;
};

export const getPostDetail = async (postId: string) => {
  const post = await prismaClient.post.findUnique({
    where: { id: postId },
    include: {
      ward: true,
      postImages: true,
      postAmenities: {
        include: { amenity: true }
      },
      comments: {
        where: {
          status: comment_status.DISPLAYED,
          parentId: null
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              roles: true
            }
          },
          replies: {
            where: { status: comment_status.DISPLAYED },
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  roles: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  return post;
};

export const getMyPosts = async (
  currentUser: user,
  page: number = 1,
  limit: number = 10
) => {
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
        ward: true,
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
