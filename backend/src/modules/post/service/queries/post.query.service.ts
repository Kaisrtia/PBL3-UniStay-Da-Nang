import prismaClient from '../../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../../core/exceptions/AppError';
import { calculateScore } from '../../../demand/utils/matching.handler';
import * as blockService from '../../../user/service/block.service';
import {
  ApprovedPostCacheEntry,
  approvedPostInclude,
  getApprovedPostsWithFallback
} from '../../utils/approvedPostCache';
import {
  user,
  room_type,
  post_purpose,
  Prisma,
  post_status,
  comment_status
} from '@prisma/client';

export type RecommendationLevel = 'LOW' | 'MEDIUM' | 'HIGH';

const RECOMMENDATION_SCORE_THRESHOLDS: Record<RecommendationLevel, number> = {
  LOW: 0.6,
  MEDIUM: 0.75,
  HIGH: 0.9
};

const buildApprovedPostWhere = (
  filters: PostFilters,
  blockedUserIds: string[]
): Prisma.postWhereInput => {
  const keyword = filters.keyword?.trim();

  return {
    status: 'APPROVED',
    ...((filters.userId || blockedUserIds.length > 0) && {
      userId: {
        ...(filters.userId && { equals: filters.userId }),
        ...(blockedUserIds.length > 0 && { notIn: blockedUserIds })
      }
    }),
    ...(filters.purpose && { purpose: filters.purpose }),
    ...(filters.wardId !== undefined && { wardId: filters.wardId }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { detailAddress: { contains: keyword, mode: 'insensitive' } },
        { exactAddress: { contains: keyword, mode: 'insensitive' } },
        { city: { contains: keyword, mode: 'insensitive' } },
        { ward: { name: { contains: keyword, mode: 'insensitive' } } }
      ]
    }),
    ...((filters.minArea !== undefined || filters.maxArea !== undefined) && {
      area: {
        ...(filters.minArea !== undefined && { gte: filters.minArea }),
        ...(filters.maxArea !== undefined && { lte: filters.maxArea })
      }
    }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice })
      }
    }),
    ...(filters.roomType && { roomType: filters.roomType }),
    ...(filters.verifiedHost === true && {
      user: { hosts: { some: { isVerified: true } } }
    }),
    ...(filters.amenities?.length && {
      postAmenities: {
        some: { amenityId: { in: filters.amenities } }
      }
    }),
    ...(filters.hasMedia === true && {
      postImages: { some: {} }
    })
  };
};

export interface PostFilters {
  userId?: string;
  purpose?: post_purpose;
  status?: post_status; // Used for admin-level filtering
  wardId?: number;
  keyword?: string;

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

export interface NearbyPostFilters {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}

export type AdminPostSort = 'newest' | 'oldest' | 'statusAsc' | 'statusDesc';

export interface RoutePathInput {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: {
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: [number, number][];
    };
  }[];
}

const buildPaginationMeta = (
  totalItems: number,
  itemCount: number,
  currentPage: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    totalItems,
    itemCount,
    itemsPerPage,
    totalPages,
    currentPage,
    // Backward-compatible aliases for existing frontend/admin consumers.
    total: totalItems,
    page: currentPage,
    limit: itemsPerPage
  };
};

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number
) => {
  const earthRadiusKm = 6371;
  const latitudeDistance = degreesToRadians(targetLatitude - originLatitude);
  const longitudeDistance = degreesToRadians(targetLongitude - originLongitude);

  const a =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.cos(degreesToRadians(originLatitude)) *
      Math.cos(degreesToRadians(targetLatitude)) *
      Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getPosts = async (
  filters: PostFilters,
  currentUserId?: string
) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy ?? 'createdAt';
  const sortOrder = filters.sortOrder ?? 'desc';

  const blockedUserIds = currentUserId
    ? await blockService.getBlockedUserIds(currentUserId)
    : [];
  const where = buildApprovedPostWhere(filters, blockedUserIds);
  const [posts, totalCount] = await Promise.all([
    prismaClient.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: approvedPostInclude
    }),
    prismaClient.post.count({ where })
  ]);

  return {
    data: posts,
    meta: buildPaginationMeta(totalCount, posts.length, page, limit)
  };
};

export const getNearbyPosts = async (
  filters: NearbyPostFilters,
  currentUserId?: string
) => {
  const limit = filters.limit ?? 80;
  const [approvedPosts, blockedUserIds] = await Promise.all([
    getApprovedPostsWithFallback(),
    currentUserId
      ? blockService.getBlockedUserIds(currentUserId)
      : Promise.resolve([])
  ]);
  const posts = approvedPosts.filter(
    (post) => !blockedUserIds.includes(post.userId)
  );

  const nearbyPosts = posts
    .map((post) => {
      const latitude = Number(post.latitude);
      const longitude = Number(post.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const distanceKm = calculateDistanceKm(
        filters.latitude,
        filters.longitude,
        latitude,
        longitude
      );

      return {
        ...post,
        distanceKm: Number(distanceKm.toFixed(2))
      };
    })
    .filter(
      (post): post is NonNullable<typeof post> =>
        post !== null && post.distanceKm <= filters.radiusKm
    )
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, limit);

  return {
    data: nearbyPosts,
    meta: {
      total: nearbyPosts.length,
      limit,
      radiusKm: filters.radiusKm,
      origin: {
        latitude: filters.latitude,
        longitude: filters.longitude
      }
    }
  };
};

export const getRoutePath = async (input: RoutePathInput) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${input.fromLongitude},${input.fromLatitude};${input.toLongitude},${input.toLatitude}`
  );
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'false');

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        'Routing service is currently unavailable'
      );
    }

    const result = (await response.json()) as OsrmRouteResponse;
    const route = result.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (
      result.code !== 'Ok' ||
      !route ||
      route.distance === undefined ||
      route.duration === undefined ||
      !coordinates ||
      coordinates.length === 0
    ) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Route path not found');
    }

    return {
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      geometry: coordinates.map(([longitude, latitude]) => [
        latitude,
        longitude
      ])
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      'Could not calculate route path'
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getRecommendedPosts = async (
  currentUser: user,
  page: number = 1,
  limit: number = 10,
  level: RecommendationLevel = 'LOW'
) => {
  const demand = await prismaClient.student_demand.findUnique({
    where: { studentId: currentUser.id },
    include: {
      university: true,
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

  let cachedPosts: ApprovedPostCacheEntry[] =
    await getApprovedPostsWithFallback();
  const blockedUserIds = await blockService.getBlockedUserIds(currentUser.id);

  if (blockedUserIds.length > 0) {
    cachedPosts = cachedPosts.filter(
      (post) => !blockedUserIds.includes(post.userId)
    );
  }

  const scoreThreshold = RECOMMENDATION_SCORE_THRESHOLDS[level];

  // Filter and score posts
  const scoredPosts = cachedPosts
    .map((post) => ({
      ...post,
      score: calculateScore(post, demand)
    }))
    .filter((post) => post.score >= scoreThreshold);

  // Sort by score descending
  scoredPosts.sort((first, second) => second.score - first.score);

  // Paginate
  const skip = (page - 1) * limit;
  const paginatedPosts = scoredPosts.slice(skip, skip + limit);

  return {
    data: paginatedPosts,
    meta: buildPaginationMeta(
      scoredPosts.length,
      paginatedPosts.length,
      page,
      limit
    )
  };
};

export const getPostsForAdmin = async (
  status?: post_status,
  page: number = 1,
  limit: number = 10,
  sort: AdminPostSort = 'newest'
) => {
  const skip = (page - 1) * limit;
  const orderBy: Prisma.postOrderByWithRelationInput[] =
    sort === 'oldest'
      ? [{ createdAt: 'asc' }]
      : sort === 'statusAsc'
        ? [{ status: 'asc' }, { createdAt: 'desc' }]
        : sort === 'statusDesc'
          ? [{ status: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }];

  const where: Prisma.postWhereInput = {};
  if (status) {
    where.status = status;
  }

  const [posts, totalCount] = await Promise.all([
    prismaClient.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
    meta: buildPaginationMeta(totalCount, posts.length, page, limit)
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

export const getPostDetail = async (
  postId: string,
  currentUser?: Pick<user, 'id' | 'role'>
) => {
  const currentUserId = currentUser?.id;
  const blockedCommentUserFilter =
    await blockService.getBlockedCommentUserFilter(currentUserId);
  const post = await prismaClient.post.findFirst({
    where: {
      id: postId,
      ...(currentUser?.role !== 'ADMIN' && {
        OR: [
          { status: post_status.APPROVED },
          ...(currentUserId ? [{ userId: currentUserId }] : [])
        ]
      })
    },
    include: {
      ward: true,
      postImages: true,
      postAmenities: {
        include: { amenity: true }
      },
      comments: {
        where: {
          status: comment_status.DISPLAYED,
          parentId: null,
          ...blockedCommentUserFilter
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true
            }
          },
          replies: {
            where: {
              status: comment_status.DISPLAYED,
              ...blockedCommentUserFilter
            },
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  role: true
                }
              }
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          hosts: {
            select: { isVerified: true, avgStar: true }
          }
        }
      }
    }
  });

  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  if (
    currentUserId &&
    post.userId !== currentUserId &&
    (await blockService.areUsersBlocked(currentUserId, post.userId))
  ) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  const isBlockedByCurrentUser = await blockService.isBlockedByCurrentUser(
    currentUserId,
    post.userId
  );

  return {
    ...post,
    isBlockedByCurrentUser
  };
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
    meta: buildPaginationMeta(totalCount, posts.length, page, limit)
  };
};
