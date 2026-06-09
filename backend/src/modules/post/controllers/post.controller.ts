import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as postQueryService from '../service/queries/post.query.service';
import * as postCommandService from '../service/commands/post.command.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';
import { room_type, post_purpose, post_status } from '@prisma/client';
import { parsePagination } from '../../../core/utils/pagination';

// -- Post Listing --

export const handleGetPosts = async (req: Request, res: Response) => {
  const {
    userId,
    purpose,
    wardId,
    keyword,

    minArea,
    maxArea,
    minPrice,
    maxPrice,
    roomType,
    verifiedHost,
    amenities,
    hasMedia,
    page,
    limit,
    sortBy,
    sortOrder
  } = req.query;

  const filters: postQueryService.PostFilters = {};

  if (userId !== undefined && typeof userId === 'string') {
    filters.userId = userId;
  }

  if (purpose !== undefined) {
    const validPurposes: post_purpose[] = ['RENT', 'FIND_ROOMMATE'];
    if (!validPurposes.includes(purpose as post_purpose)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
      );
    }
    filters.purpose = purpose as post_purpose;
  }

  if (keyword !== undefined && typeof keyword === 'string') {
    filters.keyword = keyword;
  }

  if (wardId !== undefined) {
    const parsedWardId = Number(wardId);
    if (!Number.isInteger(parsedWardId) || parsedWardId <= 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'wardId must be a positive integer');
    }
    filters.wardId = parsedWardId;
  }

  const numericFilters = { minArea, maxArea, minPrice, maxPrice };
  for (const [field, value] of Object.entries(numericFilters)) {
    if (value === undefined) continue;
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, `${field} must be a non-negative number`);
    }
    filters[field as keyof typeof numericFilters] = parsedValue;
  }

  if (
    filters.minArea !== undefined &&
    filters.maxArea !== undefined &&
    filters.minArea > filters.maxArea
  ) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'minArea must not exceed maxArea');
  }
  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'minPrice must not exceed maxPrice');
  }

  if (roomType !== undefined) {
    const validRoomTypes: room_type[] = ['ROOM', 'APARTMENT', 'HOUSE'];
    if (!validRoomTypes.includes(roomType as room_type)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Invalid roomType. Must be one of: ${validRoomTypes.join(', ')}`
      );
    }
    filters.roomType = roomType as room_type;
  }

  if (verifiedHost !== undefined) {
    if (verifiedHost !== 'true' && verifiedHost !== 'false') {
      throw new AppError(HttpStatus.BAD_REQUEST, 'verifiedHost must be true or false');
    }
    filters.verifiedHost = verifiedHost === 'true';
  }
  if (hasMedia !== undefined) {
    if (hasMedia !== 'true' && hasMedia !== 'false') {
      throw new AppError(HttpStatus.BAD_REQUEST, 'hasMedia must be true or false');
    }
    filters.hasMedia = hasMedia === 'true';
  }

  // amenities = "1,3,5" → [1, 3, 5]
  if (
    amenities !== undefined &&
    typeof amenities === 'string' &&
    amenities.trim().length > 0
  ) {
    const amenityIds = amenities.split(',').map(Number);
    if (!amenityIds.every((id) => Number.isInteger(id) && id > 0)) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'amenities must contain positive integer IDs');
    }
    filters.amenities = Array.from(new Set(amenityIds));
  }

  const pagination = parsePagination({ page, limit }, 10, 100);
  filters.page = pagination.page;
  filters.limit = pagination.limit;

  const validSortFields = ['createdAt', 'price', 'area', 'viewCount'];
  if (sortBy !== undefined) {
    if (!validSortFields.includes(sortBy as string)) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid sortBy value');
    }
    filters.sortBy = sortBy as postQueryService.PostFilters['sortBy'];
  }

  if (sortOrder !== undefined) {
    if (!['asc', 'desc'].includes(sortOrder as string)) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'sortOrder must be asc or desc');
    }
    filters.sortOrder = sortOrder as 'asc' | 'desc';
  }

  const result = await postQueryService.getPosts(filters, req.user?.id);

  sendSuccess(res, HttpStatus.OK, result, 'Posts fetched successfully');
};

const parseFiniteNumber = (value: unknown) => {
  if (value === undefined || Array.isArray(value)) {
    return undefined;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Query parameter must be a finite number');
  }
  return parsedValue;
};

export const handleGetNearbyPosts = async (req: Request, res: Response) => {
  const latitude = parseFiniteNumber(req.query.lat);
  const longitude = parseFiniteNumber(req.query.lng);
  const radiusKm = parseFiniteNumber(req.query.radiusKm) ?? 3;
  const limit = parseFiniteNumber(req.query.limit) ?? 80;

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Valid lat and lng query parameters are required'
    );
  }

  if (radiusKm <= 0 || radiusKm > 50) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'radiusKm must be greater than 0 and no more than 50'
    );
  }

  const result = await postQueryService.getNearbyPosts(
    {
      latitude,
      longitude,
      radiusKm,
      limit: Math.min(100, Math.max(1, Math.floor(limit)))
    },
    req.user?.id
  );

  sendSuccess(res, HttpStatus.OK, result, 'Nearby posts fetched successfully');
};

const isValidCoordinatePair = (latitude?: number, longitude?: number) => {
  return (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const handleGetRoutePath = async (req: Request, res: Response) => {
  const fromLatitude = parseFiniteNumber(req.query.fromLat);
  const fromLongitude = parseFiniteNumber(req.query.fromLng);
  const toLatitude = parseFiniteNumber(req.query.toLat);
  const toLongitude = parseFiniteNumber(req.query.toLng);

  if (
    !isValidCoordinatePair(fromLatitude, fromLongitude) ||
    !isValidCoordinatePair(toLatitude, toLongitude)
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Valid fromLat, fromLng, toLat, and toLng query parameters are required'
    );
  }

  const result = await postQueryService.getRoutePath({
    fromLatitude: fromLatitude!,
    fromLongitude: fromLongitude!,
    toLatitude: toLatitude!,
    toLongitude: toLongitude!
  });

  sendSuccess(res, HttpStatus.OK, result, 'Route path fetched successfully');
};

export const handleGetRecommendedPosts = async (
  req: Request,
  res: Response
) => {
  const { page, limit } = parsePagination(req.query, 10, 100);

  const result = await postQueryService.getRecommendedPosts(
    req.user!,
    page,
    limit
  );

  sendSuccess(
    res,
    HttpStatus.OK,
    result,
    'Recommended posts fetched successfully'
  );
};

export const handleGetMyPosts = async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query, 10, 100);

  const result = await postQueryService.getMyPosts(req.user!, page, limit);

  sendSuccess(res, HttpStatus.OK, result, 'My posts fetched successfully');
};

export const handleGetPostsByStatusForAdmin = async (
  req: Request,
  res: Response
) => {
  const { status, sort } = req.query;
  const { page, limit } = parsePagination(req.query, 10, 100);

  let postStatus: post_status | undefined;
  if (status) {
    const validStatuses: post_status[] = Object.values(post_status);
    if (!validStatuses.includes(status as post_status)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }
    postStatus = status as post_status;
  }

  const validSorts: postQueryService.AdminPostSort[] = [
    'newest',
    'oldest',
    'statusAsc',
    'statusDesc'
  ];
  const selectedSort = validSorts.includes(sort as postQueryService.AdminPostSort)
    ? (sort as postQueryService.AdminPostSort)
    : 'newest';

  const result = await postQueryService.getPostsForAdmin(
    postStatus,
    page,
    limit,
    selectedSort
  );

  sendSuccess(
    res,
    HttpStatus.OK,
    result,
    'Posts fetched for admin successfully'
  );
};

export const handleGetPostStatistics = async (req: Request, res: Response) => {
  const { period } = req.query;

  const validPeriods = ['day', 'week', 'month'];
  const selectedPeriod = validPeriods.includes(period as string)
    ? (period as 'day' | 'week' | 'month')
    : 'day';

  const stats = await postQueryService.getPostStatistics(selectedPeriod);

  sendSuccess(
    res,
    HttpStatus.OK,
    stats,
    'Post statistics fetched successfully'
  );
};

export const handleGetPostsCountByWard = async (
  req: Request,
  res: Response
) => {
  const result = await postQueryService.getPostsCountByWard();

  sendSuccess(
    res,
    HttpStatus.OK,
    result,
    'Fetched post counts by ward successfully'
  );
};

// -- Post Management --

export const handleCreatePost = async (req: Request, res: Response) => {
  const {
    title,
    wardId,
    purpose,
    detailAddress,
    exactAddress,
    district,
    city,
    area,
    price,
    deposit,
    roomType,
    postPurpose,
    description,
    latitude,
    longitude,
    postImages,
    postAmenities
  } = req.body;

  // Removed manual basic requirement validations since Joi handles it via middleware

  const post = await postCommandService.createPost(req.user!, {
    title,
    wardId: Number(wardId),
    purpose,
    detailAddress,
    exactAddress,
    district,
    city,
    area: Number(area),
    price: Number(price),
    deposit: Number(deposit),
    roomType,
    postPurpose,
    description,
    latitude: Number(latitude),
    longitude: Number(longitude),
    postImages,
    postAmenities
  });

  sendSuccess(
    res,
    HttpStatus.CREATED,
    post,
    'Post created successfully. It is currently in PENDING state.'
  );
};

export const handleGetPostDetail = async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const post = await postQueryService.getPostDetail(postId, req.user);

  sendSuccess(res, HttpStatus.OK, post, 'Post detail fetched successfully');
};

export const handleCensorPostManually = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const admin = req.user;
  const { rejectionReason, status } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const post = await postCommandService.censorPost(
    admin!,
    postId,
    status,
    rejectionReason
  );

  sendSuccess(res, HttpStatus.OK, post, 'Post censored successfully');
};

export const handleUpdatePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const {
    title,
    wardId,
    purpose,
    detailAddress,
    exactAddress,
    district,
    city,
    area,
    price,
    deposit,
    roomType,
    postPurpose,
    description,
    latitude,
    longitude,
    postImages,
    postAmenities
  } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const updatedPost = await postCommandService.updatePost(req.user!, postId, {
    title,
    wardId: wardId ? Number(wardId) : undefined,
    purpose,
    detailAddress,
    exactAddress,
    district,
    city,
    area: area ? Number(area) : undefined,
    price: price ? Number(price) : undefined,
    deposit: deposit ? Number(deposit) : undefined,
    roomType,
    postPurpose,
    description,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    postImages,
    postAmenities
  });

  sendSuccess(
    res,
    HttpStatus.OK,
    updatedPost,
    'Post updated successfully. It is now in UPDATED state.'
  );
};

export const handleHidePost = async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const updatedPost = await postCommandService.hideOwnPost(req.user!, postId);

  sendSuccess(res, HttpStatus.OK, updatedPost, 'Post hidden successfully.');
};

export const handleDeletePost = async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const result = await postCommandService.deleteOwnPost(req.user!, postId);

  sendSuccess(res, HttpStatus.OK, result, 'Post deleted successfully.');
};
