import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user, room_type } from '@prisma/client';

export const createStudentDemand = async (
  currentUser: user,
  data: {
    wardId: number;
    universityId?: string;
    minPrice: number;
    maxPrice: number;
    roomType: room_type;
    isLookingForRoommate?: boolean;
    roommateGender?: string;
    rommateCriteria?: string;
  }
) => {
  // Validate the ward
  const ward = await prismaClient.ward.findUnique({
    where: { id: data.wardId }
  });

  if (!ward) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
  }

  // Validate the university only if provided
  if (data.universityId) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });

    if (!university) {
      throw new AppError(HttpStatus.NOT_FOUND, 'University not found');
    }
  }

  if (data.minPrice < 0 || data.maxPrice < 0 || data.minPrice > data.maxPrice) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid price range');
  }

  if (!Object.values(room_type).includes(data.roomType)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid room type');
  }

  // Upsert the demand limit to 1 per student (since studentId is @id in student_demand)
  const demand = await prismaClient.student_demand.upsert({
    where: { studentId: currentUser.id },
    update: {
      wardId: data.wardId,
      ...(data.universityId ? { universityId: data.universityId } : { universityId: null }),
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      roomType: data.roomType,
      isLookingForRoommate: data.isLookingForRoommate ?? false,
      roommateGender: data.roommateGender ?? '',
      rommateCriteria: data.rommateCriteria ?? ''
    },
    create: {
      studentId: currentUser.id,
      wardId: data.wardId,
      ...(data.universityId && { universityId: data.universityId }),
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      roomType: data.roomType,
      isLookingForRoommate: data.isLookingForRoommate ?? false,
      roommateGender: data.roommateGender ?? '',
      rommateCriteria: data.rommateCriteria ?? ''
    }
  });

  return demand;
};

// ─── Favourite Posts ─────────────────────────────────────────────────────────

const requirePost = async (postId: string) => {
  const post = await prismaClient.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }
  return post;
};

export const addFavouritePost = async (currentUser: user, postId: string) => {
  await requirePost(postId);

  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (existing) {
    throw new AppError(HttpStatus.CONFLICT, 'Post is already in your favourites');
  }

  return prismaClient.student_favorite_post.create({
    data: { studentId: currentUser.id, postId }
  });
};

export const removeFavouritePost = async (currentUser: user, postId: string) => {

  const existing = await prismaClient.student_favorite_post.findUnique({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });

  if (!existing) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found in your favourites');
  }

  await prismaClient.student_favorite_post.delete({
    where: { studentId_postId: { studentId: currentUser.id, postId } }
  });
};

// ─── Accommodation Request ────────────────────────────────────────────────────

export const createAccommodationRequest = async (currentUser: user, postId: string) => {
  const post = await requirePost(postId);

  if (post.userId === currentUser.id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot request your own post');
  }

  const existing = await prismaClient.accomodation_request.findUnique({
    where: { postId_userId: { postId, userId: currentUser.id } }
  });

  if (existing) {
    throw new AppError(HttpStatus.CONFLICT, 'You have already submitted a request for this post');
  }

  return prismaClient.accomodation_request.create({
    data: { postId, userId: currentUser.id }
  });
};
