import { Prisma } from '@prisma/client';

import prismaClient from '../../../core/config/prisma';
import { cacheConnection } from '../../../core/config/redis.connection';

export const APPROVED_POST_CACHE_KEY = 'cache:posts:approved';
const APPROVED_POST_CACHE_TTL_SECONDS = 10 * 60;
const PARSED_POST_CACHE_TTL_MS = 5 * 1000;

let parsedPostCache:
  | { posts: ApprovedPostCacheEntry[]; expiresAt: number }
  | undefined;
let cacheReadPromise: Promise<ApprovedPostCacheEntry[] | null> | undefined;
let databaseFallbackPromise: Promise<ApprovedPostCacheEntry[]> | undefined;

export const approvedPostInclude = Prisma.validator<Prisma.postInclude>()({
  postImages: true,
  postAmenities: {
    include: { amenity: true }
  },
  ward: true,
  user: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      hosts: {
        select: { isVerified: true }
      }
    }
  },
  _count: {
    select: { comments: true }
  }
});

export type ApprovedPostCacheEntry = Prisma.postGetPayload<{
  include: typeof approvedPostInclude;
}>;

const saveParsedPostCache = (posts: ApprovedPostCacheEntry[]) => {
  parsedPostCache = {
    posts,
    expiresAt: Date.now() + PARSED_POST_CACHE_TTL_MS
  };
};

export const fetchApprovedPostsFromDatabase = () =>
  prismaClient.post.findMany({
    where: { status: 'APPROVED' },
    include: approvedPostInclude,
    orderBy: { createdAt: 'desc' }
  });

export const saveApprovedPostsToCache = async (
  posts: ApprovedPostCacheEntry[]
) => {
  saveParsedPostCache(posts);
  await cacheConnection.set(
    APPROVED_POST_CACHE_KEY,
    JSON.stringify(posts),
    'EX',
    APPROVED_POST_CACHE_TTL_SECONDS
  );
};

export const refreshApprovedPostCache = async () => {
  const posts = await fetchApprovedPostsFromDatabase();
  await saveApprovedPostsToCache(posts);
  return posts;
};

export const getApprovedPostsFromCache = async () => {
  if (parsedPostCache && parsedPostCache.expiresAt > Date.now()) {
    return parsedPostCache.posts;
  }

  if (!cacheReadPromise) {
    cacheReadPromise = (async () => {
      try {
        const cachedPostsJson = await cacheConnection.get(
          APPROVED_POST_CACHE_KEY
        );

        if (cachedPostsJson) {
          const cachedPosts: unknown = JSON.parse(cachedPostsJson);
          if (Array.isArray(cachedPosts)) {
            const posts = cachedPosts as ApprovedPostCacheEntry[];
            saveParsedPostCache(posts);
            return posts;
          }
        }
      } catch (error) {
        console.warn(
          'Could not read approved posts from Redis; using database',
          error
        );
      }

      return null;
    })().finally(() => {
      cacheReadPromise = undefined;
    });
  }

  return cacheReadPromise;
};

export const getApprovedPostsWithFallback = async () => {
  const cachedPosts = await getApprovedPostsFromCache();
  if (cachedPosts) return cachedPosts;

  if (!databaseFallbackPromise) {
    databaseFallbackPromise = fetchApprovedPostsFromDatabase()
      .then((posts) => {
        saveParsedPostCache(posts);
        saveApprovedPostsToCache(posts).catch((error) => {
          console.warn('Could not update approved post cache', error);
        });
        return posts;
      })
      .finally(() => {
        databaseFallbackPromise = undefined;
      });
  }

  return databaseFallbackPromise;
};
