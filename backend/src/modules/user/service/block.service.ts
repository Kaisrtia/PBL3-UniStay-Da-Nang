import HttpStatus from 'http-status';
import { Prisma, user } from '@prisma/client';

import prismaClient from '../../../core/config/prisma';
import { AppError } from '../../../core/exceptions/AppError';

export const getBlockedUserIds = async (currentUserId: string) => {
  const blocks = await prismaClient.user_block.findMany({
    where: {
      OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }]
    },
    select: {
      blockerId: true,
      blockedId: true
    }
  });

  return blocks.map((block) =>
    block.blockerId === currentUserId ? block.blockedId : block.blockerId
  );
};

export const getBlockedUserFilter = async (
  currentUserId?: string
): Promise<Prisma.postWhereInput> => {
  if (!currentUserId) {
    return {};
  }

  const blockedUserIds = await getBlockedUserIds(currentUserId);

  if (blockedUserIds.length === 0) {
    return {};
  }

  return {
    userId: {
      notIn: blockedUserIds
    }
  };
};

export const getBlockedCommentUserFilter = async (
  currentUserId?: string
): Promise<Prisma.commentWhereInput> => {
  if (!currentUserId) {
    return {};
  }

  const blockedUserIds = await getBlockedUserIds(currentUserId);

  if (blockedUserIds.length === 0) {
    return {};
  }

  return {
    userId: {
      notIn: blockedUserIds
    }
  };
};

export const areUsersBlocked = async (
  firstUserId: string,
  secondUserId: string
) => {
  if (firstUserId === secondUserId) {
    return false;
  }

  const block = await prismaClient.user_block.findFirst({
    where: {
      OR: [
        { blockerId: firstUserId, blockedId: secondUserId },
        { blockerId: secondUserId, blockedId: firstUserId }
      ]
    }
  });

  return Boolean(block);
};

export const listBlockedUsers = async (currentUser: user) => {
  const blocks = await prismaClient.user_block.findMany({
    where: { blockerId: currentUser.id },
    orderBy: { createdAt: 'desc' },
    include: {
      blocked: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          phone: true,
          role: true
        }
      }
    }
  });

  return blocks.map((block) => ({
    blockedUser: {
      ...block.blocked,
      roles: [block.blocked.role]
    },
    createdAt: block.createdAt
  }));
};

export const blockUser = async (currentUser: user, blockedId: string) => {
  const targetUserId = blockedId.trim();

  if (!targetUserId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'blockedId is required');
  }

  if (targetUserId === currentUser.id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot block yourself');
  }

  const targetUser = await prismaClient.user.findUnique({
    where: { id: targetUserId },
    select: { id: true }
  });

  if (!targetUser) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  return prismaClient.user_block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: currentUser.id,
        blockedId: targetUserId
      }
    },
    create: {
      blockerId: currentUser.id,
      blockedId: targetUserId
    },
    update: {}
  });
};

export const unblockUser = async (currentUser: user, blockedId: string) => {
  const targetUserId = blockedId.trim();

  if (!targetUserId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'blockedId is required');
  }

  const result = await prismaClient.user_block.deleteMany({
    where: {
      blockerId: currentUser.id,
      blockedId: targetUserId
    }
  });

  if (result.count === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Blocked user not found');
  }
};

export const isBlockedByCurrentUser = async (
  currentUserId: string | undefined,
  targetUserId: string
) => {
  if (!currentUserId || currentUserId === targetUserId) {
    return false;
  }

  const block = await prismaClient.user_block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: currentUserId,
        blockedId: targetUserId
      }
    }
  });

  return Boolean(block);
};
