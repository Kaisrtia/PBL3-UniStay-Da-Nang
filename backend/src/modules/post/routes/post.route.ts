import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import * as favouriteController from '../controllers/favourite.controller';
import * as accommodationReqController from '../controllers/accommodationReq.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  createPostSchema,
  updatePostSchema
} from '../validation/post.validation';
import { account_role } from '@prisma/client';

const postRouter = Router();

// -- Post Listing --

// List posts with optional filters (public — only APPROVED posts are returned)
postRouter.get('/', asyncHandler(postController.handleGetPosts));

// Recommend posts for a student based on their demand and preferences (Student only)
postRouter.get(
  '/recommendations',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(postController.handleGetRecommendedPosts)
);

// Get my posts (Student, Host)
postRouter.get(
  '/me',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(postController.handleGetMyPosts)
);

// Get all posts for admin (Admin only)
postRouter.get(
  '/admin/all',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(postController.handleGetPostsByStatusForAdmin)
);

// Get post statistics for admin (Admin only)
postRouter.get(
  '/admin/statistics',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(postController.handleGetPostStatistics)
);

// Get post counts grouped by ward
postRouter.get(
  '/count-by-ward',
  asyncHandler(postController.handleGetPostsCountByWard)
);

// -- Favourite Posts --

// List favourite posts (Student only)
postRouter.get(
  '/favourites',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(favouriteController.handleGetFavouritePosts)
);

// List requests sent to posts owned by the current host/student
postRouter.get(
  '/accommodation-requests/received',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(accommodationReqController.handleGetReceivedAccommodationRequests)
);

// List requests submitted by the current student
postRouter.get(
  '/accommodation-requests/sent',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(accommodationReqController.handleGetSentAccommodationRequests)
);

// -- Post Management --

// Create Post (Users, Students, Hosts)
postRouter.post(
  '/',
  verifyToken,
  authorize([account_role.USER]),
  validate(createPostSchema),
  asyncHandler(postController.handleCreatePost)
);

// Get detail post
postRouter.get(
  '/:postId',
  asyncHandler(postController.handleGetPostDetail)
);

// Update post (Student, Host)
postRouter.patch(
  '/:postId',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST]),
  validate(updatePostSchema),
  asyncHandler(postController.handleUpdatePost)
);

// Censor post (Admin only)
postRouter.patch(
  '/:postId/censor',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(postController.handleCensorPostManually)
);

// Add a post to favourites (Student only)
postRouter.post(
  '/favourites',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(favouriteController.handleAddFavouritePost)
);

// Remove a post from favourites (Student only)
postRouter.delete(
  '/favourites/:postId',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(favouriteController.handleRemoveFavouritePost)
);

// -- Accommodation Requests --

// Submit a shared accommodation request (Student only)
postRouter.post(
  '/accommodation-requests',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(accommodationReqController.handleCreateAccommodationRequest)
);

export default postRouter;
