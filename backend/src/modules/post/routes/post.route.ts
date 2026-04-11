import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const postRouter = Router();

// -- Post Listing --

// List posts with optional filters (public — only APPROVED posts are returned)
// Query params: wardId, districtId, minArea, maxArea, minPrice, maxPrice,
//               roomType, verifiedHost, amenities (comma-separated IDs),
//               hasMedia, page, limit, sortBy, sortOrder
postRouter.get(
  '/',
  asyncHandler(postController.handleGetPosts)
);

// Get my posts (Student, Host)
postRouter.get(
  '/me',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(postController.handleGetMyPosts)
);

// -- Post Management --

// Create Post (Users, Students, Hosts)
postRouter.post(
  '/',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(postController.handleCreatePost)
);

// Get detail post
postRouter.get(
  '/:postId',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(postController.handleGetPostDetail)
);

// Update post (Student, Host)
postRouter.patch(
  '/:postId',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST]),
  asyncHandler(postController.handleUpdatePost)
);

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
