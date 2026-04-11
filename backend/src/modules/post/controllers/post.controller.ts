import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as postService from '../service/post.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';
import { room_type, post_purpose, post_status } from '@prisma/client';

// -- Post Listing --

export const handleGetPosts = async (req: Request, res: Response) => {
  const {
    purpose,
    wardId,
    districtId,
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

  const filters: postService.PostFilters = {};

  if (purpose !== undefined) {
    const validPurposes: post_purpose[] = ['RENT', 'FIND_ROOMMATE'];
    if (!validPurposes.includes(purpose as post_purpose)) {
      throw new AppError(HttpStatus.BAD_REQUEST, `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`);
    }
    filters.purpose = purpose as post_purpose;
  }

  if (wardId !== undefined)      filters.wardId = Number(wardId);
  if (districtId !== undefined)  filters.districtId = Number(districtId);
  if (minArea !== undefined)     filters.minArea = Number(minArea);
  if (maxArea !== undefined)     filters.maxArea = Number(maxArea);
  if (minPrice !== undefined)    filters.minPrice = Number(minPrice);
  if (maxPrice !== undefined)    filters.maxPrice = Number(maxPrice);

  if (roomType !== undefined) {
    const validRoomTypes: room_type[] = ['ROOM', 'APARTMENT', 'HOUSE'];
    if (!validRoomTypes.includes(roomType as room_type)) {
      throw new AppError(HttpStatus.BAD_REQUEST, `Invalid roomType. Must be one of: ${validRoomTypes.join(', ')}`);
    }
    filters.roomType = roomType as room_type;
  }

  if (verifiedHost !== undefined) filters.verifiedHost = verifiedHost === 'true';
  if (hasMedia !== undefined)     filters.hasMedia = hasMedia === 'true';

  // amenities = "1,3,5" → [1, 3, 5]
  if (amenities !== undefined && typeof amenities === 'string' && amenities.trim().length > 0) {
    filters.amenities = amenities.split(',').map(Number).filter(n => !isNaN(n));
  }

  if (page !== undefined)      filters.page = Math.max(1, Number(page));
  if (limit !== undefined)     filters.limit = Math.min(100, Math.max(1, Number(limit)));

  const validSortFields = ['createdAt', 'price', 'area', 'viewCount'];
  if (sortBy !== undefined && validSortFields.includes(sortBy as string)) {
    filters.sortBy = sortBy as postService.PostFilters['sortBy'];
  }

  if (sortOrder !== undefined && ['asc', 'desc'].includes(sortOrder as string)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc';
  }

  const result = await postService.getPosts(filters);

  sendSuccess(res, HttpStatus.OK, result, 'Posts fetched successfully');
};

export const handleGetMyPosts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await postService.getMyPosts(req.user!, page, limit);

  sendSuccess(res, HttpStatus.OK, result, 'My posts fetched successfully');
};

export const handleGetPostsByStatusForAdmin = async (req: Request, res: Response) => {
  const { status } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  let postStatus: post_status | undefined;
  if (status) {
    const validStatuses: post_status[] = Object.values(post_status);
    if (!validStatuses.includes(status as post_status)) {
      throw new AppError(HttpStatus.BAD_REQUEST, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    postStatus = status as post_status;
  }

  const result = await postService.getPostsForAdmin(postStatus, page, limit);

  sendSuccess(res, HttpStatus.OK, result, 'Posts fetched for admin successfully');
};

export const handleGetPostStatistics = async (req: Request, res: Response) => {
  const { period } = req.query;

  const validPeriods = ['day', 'week', 'month'];
  const selectedPeriod = validPeriods.includes(period as string) 
    ? (period as 'day' | 'week' | 'month') 
    : 'day';

  const stats = await postService.getPostStatistics(selectedPeriod);

  sendSuccess(res, HttpStatus.OK, stats, 'Post statistics fetched successfully');
};

// -- Post Management --

export const handleCreatePost = async (req: Request, res: Response) => {
  const {
    title,
    wardId,
    purpose,
    detailAddress,
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

  // Basic required fields validation
  if (
    !title ||
    wardId === undefined ||
    !purpose ||
    !detailAddress ||
    area === undefined ||
    price === undefined ||
    deposit === undefined ||
    !roomType ||
    !postPurpose ||
    !description ||
    latitude === undefined ||
    longitude === undefined
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Missing required fields to create a post'
    );
  }

  const post = await postService.createPost(req.user!, {
    title,
    wardId: Number(wardId),
    purpose,
    detailAddress,
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

  const post = await postService.getPostDetail(postId);

  sendSuccess(res, HttpStatus.OK, post, 'Post detail fetched successfully');
};

// -- Favourite Posts --

export const handleAddFavouritePost = async (req: Request, res: Response) => {
  const { postId } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const favourite = await postService.addFavouritePost(req.user!, postId);

  sendSuccess(res, HttpStatus.CREATED, favourite, 'Post added to favourites');
};

export const handleRemoveFavouritePost = async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  await postService.removeFavouritePost(req.user!, postId);

  sendSuccess(res, HttpStatus.OK, null, 'Post removed from favourites');
};

// -- Accommodation Requests --

export const handleCreateAccommodationRequest = async (req: Request, res: Response) => {
  const { postId } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const request = await postService.createAccommodationRequest(req.user!, postId);

  sendSuccess(res, HttpStatus.CREATED, request, 'Accommodation request submitted successfully');
};

export const handleUpdatePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const {
    title,
    wardId,
    purpose,
    detailAddress,
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

  const updatedPost = await postService.updatePost(req.user!, postId, {
    title,
    wardId: wardId ? Number(wardId) : undefined,
    purpose,
    detailAddress,
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

  sendSuccess(res, HttpStatus.OK, updatedPost, 'Post updated successfully. It is now in UPDATED state.');
};
