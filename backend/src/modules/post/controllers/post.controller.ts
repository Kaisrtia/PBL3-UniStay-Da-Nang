import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as postService from '../service/post.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

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
