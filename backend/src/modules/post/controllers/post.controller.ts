import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as postService from '../service/post.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

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
