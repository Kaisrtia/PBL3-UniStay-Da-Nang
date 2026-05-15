import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as favouriteService from '../service/favourite.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleGetFavouritePosts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const favourites = await favouriteService.getFavouritePosts(
    req.user!,
    page,
    limit
  );

  sendSuccess(res, HttpStatus.OK, favourites, 'Đã tải danh sách bài đăng yêu thích.');
};

export const handleAddFavouritePost = async (req: Request, res: Response) => {
  const { postId } = req.body;

  if (!postId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId is required');
  }

  const favourite = await favouriteService.addFavouritePost(req.user!, postId);

  sendSuccess(res, HttpStatus.CREATED, favourite, 'Đã lưu bài đăng vào danh sách yêu thích.');
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

  sendSuccess(res, HttpStatus.OK, null, 'Đã bỏ bài đăng khỏi danh sách yêu thích.');
};
