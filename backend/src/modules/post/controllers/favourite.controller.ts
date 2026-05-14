import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as favouriteService from '../service/favourite.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleAddFavouritePost = async (req: Request, res: Response) => {
  const { postId } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const favourite = await favouriteService.addFavouritePost(req.user!, postId);

  sendSuccess(res, HttpStatus.CREATED, favourite, 'Post added to favourites');
};

export const handleRemoveFavouritePost = async (
  req: Request,
  res: Response
) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  await favouriteService.removeFavouritePost(req.user!, postId);

  sendSuccess(res, HttpStatus.OK, null, 'Post removed from favourites');
};
