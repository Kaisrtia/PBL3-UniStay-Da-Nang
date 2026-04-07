import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const postRouter = Router();

// -- Favourite Posts --

// Add a post to favourites (Student only)
postRouter.post(
  '/favourites',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(postController.handleAddFavouritePost)
);

// Remove a post from favourites (Student only)
postRouter.delete(
  '/favourites/:postId',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(postController.handleRemoveFavouritePost)
);

// -- Accommodation Requests --

// Submit a shared accommodation request (Student only)
postRouter.post(
  '/accommodation-requests',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(postController.handleCreateAccommodationRequest)
);

export default postRouter;
