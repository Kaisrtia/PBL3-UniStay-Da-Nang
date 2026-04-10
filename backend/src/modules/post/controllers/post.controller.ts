import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as postService from '../service/post.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';
import { room_type } from '@prisma/client';

// -- Post Listing --

export const handleGetPosts = async (req: Request, res: Response) => {
  const {
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
