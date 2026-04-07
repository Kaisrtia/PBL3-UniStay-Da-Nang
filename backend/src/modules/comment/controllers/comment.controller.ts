import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as commentService from '../service/comment.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleCreateComment = async (req: Request, res: Response) => {
  const { postId, content, parentId } = req.body;

  if (!postId || !content) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'postId and content are required');
  }

  const comment = await commentService.createComment(req.user!, {
    postId,
    content,
    parentId
  });

  sendSuccess(res, HttpStatus.CREATED, comment, 'Comment created successfully');
};

export const handleUpdateComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Comment ID is required');
  }

  if (!content) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'content is required');
  }

  const comment = await commentService.updateComment(req.user!, id, content);

  sendSuccess(res, HttpStatus.OK, comment, 'Comment updated successfully');
};

export const handleHideComment = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Comment ID is required');
  }

  const comment = await commentService.hideComment(req.user!, id);

  sendSuccess(res, HttpStatus.OK, comment, 'Comment hidden successfully');
};
